"use server";

import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/auth";

export interface SignInActionState {
  code: string | null;
}

export async function signInWithCredentials(
  _prevState: SignInActionState,
  formData: FormData
): Promise<SignInActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/dashboard",
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

// Trailing params are required by useActionState's (prevState, formData) signature after bind().
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function signInWithGithub(
  callbackUrl: string,
  _prevState: SignInActionState,
  _formData: FormData
): Promise<SignInActionState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  try {
    await signIn("github", { redirectTo: callbackUrl || "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { code: error.type };
    }
    throw error;
  }

  return { code: null };
}
