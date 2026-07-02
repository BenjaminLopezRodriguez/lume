import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#faf8f6] px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-950">Sign in to Lume</h1>
      <LoginLink
        postLoginRedirectURL="/m/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--landing-accent-deep)" }}
      >
        Sign in
      </LoginLink>
      <p className="text-sm text-neutral-500">
        New here?{" "}
        <RegisterLink
          postLoginRedirectURL="/m/onboarding"
          className="font-medium text-neutral-900 underline"
        >
          Create an account
        </RegisterLink>
      </p>
    </main>
  );
}
