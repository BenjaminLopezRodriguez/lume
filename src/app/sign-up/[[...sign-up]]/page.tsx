import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#faf8f6] px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-950">Get started with Lume</h1>
      <RegisterLink
        postLoginRedirectURL="/m/onboarding"
        className="inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--landing-accent-deep)" }}
      >
        Create free account
      </RegisterLink>
      <p className="text-sm text-neutral-500">
        Already have an account?{" "}
        <LoginLink
          postLoginRedirectURL="/m/dashboard"
          className="font-medium text-neutral-900 underline"
        >
          Sign in
        </LoginLink>
      </p>
    </main>
  );
}
