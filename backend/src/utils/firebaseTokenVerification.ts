import axios from "axios";
import type { DecodedIdToken } from "firebase-admin/auth";
import { auth, firebaseApp } from "../config/firebase";

type LookupUser = {
  localId: string;
  email?: string;
  emailVerified?: boolean | string;
  providerUserInfo?: Array<{ providerId?: string }>;
};

function getFirebaseWebApiKey(): string | undefined {
  return process.env.FIREBASE_API_KEY?.trim();
}

function getExpectedProjectId(): string {
  return (
    process.env.FIREBASE_MAIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "tray-ed2f7"
  ).trim();
}

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production"
  );
}

function mapUserToDecodedToken(user: LookupUser): DecodedIdToken {
  const projectId = getExpectedProjectId();
  const now = Math.floor(Date.now() / 1000);

  return {
    uid: user.localId,
    email: user.email,
    email_verified:
      user.emailVerified === true || user.emailVerified === "true",
    aud: projectId,
    auth_time: now,
    sub: user.localId,
    iat: now,
    exp: now + 3600,
    iss: `https://securetoken.google.com/${projectId}`,
    firebase: {
      identities: {},
      sign_in_provider:
        user.providerUserInfo?.[0]?.providerId || "password",
    },
  } as DecodedIdToken;
}

function parseLookupUsers(data: {
  users?: LookupUser[];
}): DecodedIdToken {
  const user = data?.users?.[0];
  if (!user?.localId) {
    const err = new Error("Invalid token — no user in lookup response") as Error & {
      code?: string;
    };
    err.code = "auth/invalid-id-token";
    throw err;
  }
  return mapUserToDecodedToken(user);
}

/**
 * Verify ID token via Identity Toolkit using service-account OAuth (no web API key).
 */
async function verifyViaServiceAccount(idToken: string): Promise<DecodedIdToken> {
  const credential = firebaseApp.options.credential;
  if (!credential) {
    throw new Error("Firebase credential not configured");
  }

  const tokenResult = await credential.getAccessToken();
  const accessToken = tokenResult?.access_token;
  if (!accessToken) {
    throw new Error("Failed to obtain service account access token");
  }

  const projectId = getExpectedProjectId();

  try {
    const { data } = await axios.post<{ users?: LookupUser[] }>(
      `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
      { idToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );
    return parseLookupUsers(data);
  } catch (axiosError: unknown) {
    const ax = axiosError as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    const apiMessage =
      ax.response?.data?.error?.message ||
      ax.message ||
      "Service account token lookup failed";
    console.error("[verifyViaServiceAccount] lookup error:", apiMessage);
    const err = new Error(apiMessage) as Error & { code?: string };
    err.code = "auth/invalid-id-token";
    throw err;
  }
}

/**
 * Verify ID token via Identity Toolkit REST API (web API key).
 */
async function verifyViaIdentityToolkit(idToken: string): Promise<DecodedIdToken> {
  const apiKey = getFirebaseWebApiKey();
  if (!apiKey) {
    throw new Error("FIREBASE_API_KEY is not configured");
  }

  try {
    const { data } = await axios.post<{ users?: LookupUser[] }>(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { idToken },
      { timeout: 15000 },
    );
    return parseLookupUsers(data);
  } catch (axiosError: unknown) {
    const ax = axiosError as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    const apiMessage =
      ax.response?.data?.error?.message || ax.message || "Token lookup failed";
    console.error("[verifyViaIdentityToolkit] lookup error:", apiMessage);
    const err = new Error(apiMessage) as Error & { code?: string };
    err.code = "auth/invalid-id-token";
    throw err;
  }
}

/**
 * Verify Firebase ID token.
 * Production/Vercel: service-account lookup → API key lookup → Admin SDK.
 * Local: Admin SDK → API key → service-account lookup.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  checkRevoked = false,
): Promise<DecodedIdToken> {
  if (isProductionRuntime()) {
    const errors: string[] = [];

    try {
      return await verifyViaServiceAccount(idToken);
    } catch (e) {
      const err = e as Error;
      errors.push(`service-account: ${err.message}`);
      console.warn("[verifyFirebaseIdToken] service-account lookup failed:", err.message);
    }

    if (getFirebaseWebApiKey()) {
      try {
        return await verifyViaIdentityToolkit(idToken);
      } catch (e) {
        const err = e as Error;
        errors.push(`api-key: ${err.message}`);
        console.warn("[verifyFirebaseIdToken] API key lookup failed:", err.message);
      }
    }

    try {
      return await auth.verifyIdToken(idToken, checkRevoked);
    } catch (e) {
      const err = e as Error & { code?: string };
      errors.push(`admin: ${err.message}`);
      const combined = new Error(
        errors.join(" | ") || "Token verification failed",
      ) as Error & { code?: string };
      combined.code = err.code || "auth/invalid-id-token";
      throw combined;
    }
  }

  try {
    return await auth.verifyIdToken(idToken, checkRevoked);
  } catch (adminError) {
    const err = adminError as { code?: string; message?: string };
    console.warn(
      "[verifyFirebaseIdToken] Admin SDK failed, trying fallbacks:",
      err?.code || "unknown",
      err?.message?.slice(0, 120),
    );
  }

  try {
    return await verifyViaServiceAccount(idToken);
  } catch {
    return verifyViaIdentityToolkit(idToken);
  }
}
