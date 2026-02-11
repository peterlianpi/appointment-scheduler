import { emailOTPClient, adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.NEXT_BETTER_APP_URL,
  plugins: [
    // Username-based login
    emailOTPClient(), // Email OTP authentication
    adminClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
} = createAuthClient();
