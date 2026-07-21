import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Next.js proxy — must live at the project root as `proxy.ts`.
 *
 * Uses a lightweight NextAuth instance (no PrismaAdapter) so it runs on
 * the Edge runtime. The `authConfig` providers include `bcryptjs`, which
 * is Node-only; however Next.js only executes the `authorize` callback
 * inside API routes, not in middleware, so this is safe here.
 *
 * All routes under /protected/* are guarded. Unauthenticated requests are
 * redirected to the login page (configured via `authConfig.pages.signIn`).
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    /*
     * Match all /protected/* routes.
     * Excludes Next.js internals (_next/static, _next/image) and files
     * with an extension (favicon.ico, images, etc.) automatically via the
     * negative lookahead pattern below.
     */
    "/protected/:path*",
  ],
};
