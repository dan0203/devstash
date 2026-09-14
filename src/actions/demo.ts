"use server";

import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/auth";
import { getDemoAccountCredentials } from "@/lib/demo-account";

export interface DemoSignInResult {
  code: string | null;
}

/**
 * Signs the visitor straight into the public guest demo account — no email/
 * password typing required. Credentials are read from env vars server-side
 * and never reach the client.
 */
export async function signInAsDemoUser(): Promise<DemoSignInResult> {
  const credentials = getDemoAccountCredentials();
  if (!credentials) {
    return { code: "demo_unavailable" };
  }

  try {
    await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { code: error.code };
    }
    if (error instanceof AuthError) {
      return { code: error.type };
    }
    throw error;
  }

  return { code: null };
}
