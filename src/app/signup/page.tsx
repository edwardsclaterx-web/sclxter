import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const q = await searchParams;
  redirect(q.error ? `/account?signup=${encodeURIComponent(q.error)}` : "/account");
}
