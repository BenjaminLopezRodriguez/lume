import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { type NextRequest, NextResponse } from "next/server";

const BASE_HOSTS = new Set(["onlume.co", "www.onlume.co"]);

function isCustomDomain(host: string) {
  return (
    !!host &&
    !host.startsWith("localhost") &&
    !BASE_HOSTS.has(host) &&
    !host.endsWith(".onlume.co") &&
    !host.endsWith(".vercel.app")
  );
}

export default withAuth(
  async function middleware(request: NextRequest) {
    const host = request.headers.get("host") ?? "";
    if (isCustomDomain(host)) {
      if (request.nextUrl.pathname.startsWith("/domains")) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = `/domains/${host}${request.nextUrl.pathname}`;
      return NextResponse.rewrite(url);
    }
  },
  {
    loginPage: "/api/auth/login",
    publicPaths: [
      "/",
      "/sign-in",
      "/sign-up",
      "/domains/(.*)",
      "/s(.*)",
      "/w(.*)",
      "/menu(.*)",
    ],
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
