import { createAuthClient } from "better-auth/react";

// Browser client: calls the /api/auth endpoints of the current site.
export const authClient = createAuthClient();
