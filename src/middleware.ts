import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
  async function middleware() {},
  {
    loginPage: "/api/auth/login",
    publicPaths: ["/", "/sign-in", "/sign-up"],
  },
);

export const config = {
  matcher: ["/m/:path*"],
};
