import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">Sign in to Lume</h1>
      <LoginLink
        postLoginRedirectURL="/m/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--landing-accent-deep)" }}
      >
        Sign in
      </LoginLink>
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <RegisterLink
          postLoginRedirectURL="/m/onboarding"
          className="font-medium text-foreground underline"
        >
          Create an account
        </RegisterLink>
      </p>
    </main>
  );
}
