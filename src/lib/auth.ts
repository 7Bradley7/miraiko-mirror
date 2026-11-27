import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth, oAuthProxy } from "better-auth/plugins";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/routing";
import {
  ANILIST_AUTHORIZATION_URL,
  ANILIST_PROVIDER_ID,
  ANILIST_TOKEN_URL,
} from "@/lib/anilist/oauth";
import { fetchAniListViewer } from "@/lib/anilist/viewer";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { emailLocale } from "@/lib/email-locale";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Better Auth configuration (MRK-17, MRK-50). Emails are written in the language of the
 * page the user came from (MRK-73, see src/lib/email-locale.ts). Accounts are linked to
 * AniList with OAuth (MRK-32, see src/lib/anilist/oauth.ts).
 * The secret comes from AUTH_SECRET; sessions live in the database so they can be revoked.
 */
const PRODUCTION_URL = "https://miraiko.vercel.app";

export const auth = betterAuth({
  appName: "Miraiko",
  database: prismaAdapter(db, { provider: "postgresql" }),

  // The same code serves production, previews and local development:
  // the base URL is taken from the request, limited to our own hosts.
  baseURL: {
    allowedHosts: ["localhost:3000", "miraiko.vercel.app", "miraiko-*-bradley-419f.vercel.app"],
    fallback: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  },

  // Pages of our own sites that may receive a user back after sign-in or an OAuth flow.
  trustedOrigins: [
    "http://localhost:3000",
    PRODUCTION_URL,
    "https://miraiko-*-bradley-419f.vercel.app",
  ],

  account: {
    // AniList tokens are encrypted (with AUTH_SECRET) before they are stored.
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      // A user links AniList while signed in to Miraiko. AniList gives no email address,
      // so the link cannot be checked by email: the signed-in session is the proof.
      trustedProviders: [ANILIST_PROVIDER_ID],
      allowDifferentEmails: true,
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: true,

    // argon2id instead of Better Auth's default scrypt (see src/lib/password.ts).
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },

    // Reset links are single-use (the token is deleted once used) and expire after 1 hour.
    // The request answers the same way whether the email has an account or not.
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      const t = await emailTranslations(emailLocale({ url, request }));
      await sendEmail({
        to: user.email,
        subject: t("resetSubject"),
        ...emailBody({
          greeting: t("greeting", { name: user.name }),
          intro: t("resetIntro"),
          action: { label: t("resetAction"), url },
          outro: t("resetOutro"),
        }),
      });
    },
    onPasswordReset: async ({ user }, request) => {
      const t = await emailTranslations(emailLocale({ request }));
      await sendEmail({
        to: user.email,
        subject: t("changedSubject"),
        ...emailBody({
          greeting: t("greeting", { name: user.name }),
          intro: t("changedIntro"),
          outro: t("changedOutro"),
        }),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, url }, request) => {
      const t = await emailTranslations(emailLocale({ url, request }));
      await sendEmail({
        to: user.email,
        subject: t("verifySubject"),
        ...emailBody({
          greeting: t("greeting", { name: user.name }),
          intro: t("verifyIntro"),
          action: { label: t("verifyAction"), url },
          outro: t("verifyOutro"),
        }),
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refreshed at most once a day
  },

  // Counters are stored in the database so the limits hold across serverless instances.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
      "/link-social": { window: 60, max: 5 },
      "/unlink-account": { window: 60, max: 5 },
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: ANILIST_PROVIDER_ID,
          clientId: process.env.ANILIST_CLIENT_ID ?? "",
          clientSecret: process.env.ANILIST_CLIENT_SECRET ?? "",
          authorizationUrl: ANILIST_AUTHORIZATION_URL,
          tokenUrl: ANILIST_TOKEN_URL,
          // AniList has no scopes and does not document PKCE.
          scopes: [],
          pkce: false,
          // AniList only links an existing Miraiko account: it never creates one.
          disableSignUp: true,
          getUserInfo: (tokens) =>
            tokens.accessToken ? fetchAniListViewer(tokens.accessToken) : Promise.resolve(null),
        },
      ],
    }),
    // AniList accepts a single redirect URL per client. Previews have changing URLs, so
    // their AniList flow goes through production, which sends the result back to them.
    // Needs the same OAUTH_PROXY_SECRET in Production and Preview; off locally.
    ...(process.env.VERCEL_ENV && process.env.OAUTH_PROXY_SECRET
      ? [oAuthProxy({ productionURL: PRODUCTION_URL, secret: process.env.OAUTH_PROXY_SECRET })]
      : []),
    // Lets Server Actions set the session cookie. Must stay last.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

function emailTranslations(locale: AppLocale) {
  return getTranslations({ locale, namespace: "emails" });
}

/** Plain-text and HTML versions of a short transactional email. */
function emailBody({
  greeting,
  intro,
  action,
  outro,
}: {
  greeting: string;
  intro: string;
  action?: { label: string; url: string };
  outro: string;
}): { text: string; html: string } {
  const text = [greeting, "", intro, ...(action ? [action.url] : []), "", outro].join("\n");
  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(intro)}</p>`,
    action ? `<p><a href="${escapeHtml(action.url)}">${escapeHtml(action.label)}</a></p>` : "",
    `<p>${escapeHtml(outro)}</p>`,
  ].join("");
  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
