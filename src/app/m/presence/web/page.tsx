import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { WebPresencePageView } from "@/app/m/_components/web-presence-page-view";

export default async function PresenceWebPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return <WebPresencePageView userEmail={user?.email ?? ""} />;
}
