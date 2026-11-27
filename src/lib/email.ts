import "server-only";

import { Resend } from "resend";

type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

// Until the miraiko.fr domain is verified in Resend (MRK-77/78), emails go out from
// Resend's shared test sender, which only delivers to the Resend account owner.
const FROM = process.env.EMAIL_FROM ?? "Miraiko <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends a transactional email with Resend.
 * In development without RESEND_API_KEY, the email is logged instead of sent.
 * In production the key is required: links with tokens must never end up in logs.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set: emails cannot be sent.");
    }
    console.info(
      `[email] RESEND_API_KEY is not set, not sending "${email.subject}".\n${email.text}`,
    );
    return;
  }

  const { error } = await resend.emails.send({ from: FROM, ...email });
  if (error) {
    throw new Error(`Email "${email.subject}" could not be sent: ${error.message}`);
  }
}
