import { useTranslations } from "next-intl";

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

type AuthError = { status: number; message?: string; code?: string };

/** Returns a function that turns a Better Auth error into a short message for the user. */
export function useAuthErrorMessage() {
  const t = useTranslations("authErrors");

  return function errorMessage(error: AuthError): string {
    if (error.status === 429) {
      return t("tooManyAttempts");
    }
    switch (error.code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        return t("wrongCredentials");
      case "INVALID_PASSWORD":
        return t("wrongCurrentPassword");
      case "USER_ALREADY_EXISTS":
      case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
        return t("accountExists");
      case "PASSWORD_TOO_SHORT":
        return t("passwordTooShort", { min: MIN_PASSWORD_LENGTH });
      case "PASSWORD_TOO_LONG":
        return t("passwordTooLong", { max: MAX_PASSWORD_LENGTH });
      case "INVALID_EMAIL":
        return t("invalidEmail");
      case "INVALID_TOKEN":
        return t("invalidToken");
      default:
        // Better Auth's own messages are in English only: show a translated generic one.
        return t("unknown");
    }
  };
}
