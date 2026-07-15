import { auth } from "./auth";

export class SessionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SessionError";
    this.status = status;
  }
}

/**
 * Resolves the current signed-in user's Gmail access token, or throws a
 * SessionError with an HTTP status suitable for returning directly to the
 * client (never leaks token values in the error message).
 */
export async function requireAccessToken(): Promise<string> {
  const session = await auth();

  if (!session) {
    throw new SessionError("You need to sign in with Google to continue.", 401);
  }

  if (session.error === "RefreshAccessTokenError" || session.error === "MissingRefreshToken") {
    throw new SessionError("Your Google session has expired. Please sign in again.", 401);
  }

  if (!session.accessToken) {
    throw new SessionError("No active Gmail access token. Please sign in again.", 401);
  }

  return session.accessToken;
}
