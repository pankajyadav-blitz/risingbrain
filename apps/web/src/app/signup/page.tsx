import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up · RisingBrain" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <AuthForm mode="signup" callbackUrl={callbackUrl} />;
}
