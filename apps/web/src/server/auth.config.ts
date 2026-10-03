import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/health"];

// Edge-safe config shared by middleware and the full Auth.js setup.
export const authConfig = {
  pages: { signIn: "/login" },
  // Vercel and most hosts sit behind a proxy that sets the Host header.
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return true;
      return !!auth?.user;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
