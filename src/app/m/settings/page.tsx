import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { AccountGroupsSection } from "@/app/m/_components/account-groups-section";
import { AccountsSection } from "@/app/m/_components/accounts-section";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";

export default async function SettingsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const name =
    [user?.given_name, user?.family_name].filter(Boolean).join(" ") ||
    user?.username ||
    "Account";
  const email = user?.email ?? "";

  return (
    <PageContent>
      <PageHeader
        title="Settings"
        meta={
          <>
            <span className="text-neutral-700">{name}</span>
            {email && (
              <>
                <span className="text-neutral-400"> · </span>
                <span className="text-neutral-500">{email}</span>
              </>
            )}
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <AccountsSection />
        <AccountGroupsSection />
      </div>
    </PageContent>
  );
}
