import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

import { OnboardingView } from "@/app/m/_components/onboarding-view";
import { api } from "@/trpc/server";

export default async function OnboardingPage() {
  const { isAuthenticated } = getKindeServerSession();
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login?post_login_redirect_url=/m/onboarding");
  }

  const activeBusiness = await api.business.getActive();
  if (activeBusiness) redirect("/m/dashboard");

  return <OnboardingView />;
}
