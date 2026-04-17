import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/workbooks/:path*", "/problems/:path*", "/lectures/:path*", "/admin/:path*"],
};
