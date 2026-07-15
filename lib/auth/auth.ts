import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { isMockMode } from "@/lib/env";

if (!isMockMode() && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
  throw new Error(
    "Missing GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET in your environment. " +
      "Set both in .env.local (see .env.example), or set NEXT_PUBLIC_USE_MOCK_DATA=true to run without Google OAuth.",
  );
}

/**
 * Single minimal scope covering everything this app needs: listing/searching
 * messages, reading header metadata, and modifying labels (archive + trash).
 * gmail.modify does NOT grant permanent deletion — that requires the much
 * broader https://mail.google.com/ scope, which this app never requests.
 */
const GMAIL_SCOPES = ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.modify"].join(" ");

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "MissingRefreshToken" };
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      error?: string;
    };

    if (!response.ok || !refreshed.access_token) {
      throw new Error(refreshed.error ?? "Token refresh failed");
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    // Deliberately no token/error detail logged here.
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // Auth.js only auto-populates clientId/clientSecret from AUTH_GOOGLE_ID /
      // AUTH_GOOGLE_SECRET env vars. This project uses GOOGLE_CLIENT_ID /
      // GOOGLE_CLIENT_SECRET (per the README/.env.example), so they must be
      // passed explicitly — otherwise Google receives no client_id and
      // rejects the request with "Error 401: invalid_client".
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GMAIL_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600_000,
          error: undefined,
        };
      }

      const expiresAt = token.accessTokenExpires ?? 0;
      if (Date.now() < expiresAt - 60_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
});
