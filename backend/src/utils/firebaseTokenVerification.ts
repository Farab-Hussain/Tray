import axios from "axios";
import type { DecodedIdToken } from "firebase-admin/auth";
import { auth } from "../config/firebase";

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

/**
 * Verify a Firebase ID token via Identity Toolkit REST API.
 * Uses FIREBASE_API_KEY (web API key) — reliable on Vercel when Admin verifyIdToken fails
 * due to credential / cert-fetch issues while Firestore still works.
 */
async function verifyViaIdentityToolkit(idToken: string): Promise<DecodedIdToken> {
  const apiKey = getFirebaseWebApiKey();
  if (!apiKey) {
    throw new Error("FIREBASE_API_KEY is not configured");
  }

  let data: {
    users?: Array<{
      localId: string;
      email?: string;
      emailVerified?: boolean | string;
      providerUserInfo?: Array<{ providerId?: string }>;
    }>;
  };

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { idToken },
      { timeout: 15000 },
    );
    data = response.data;
  } catch (axiosError: unknown) {
    const ax = axiosError as {
      response?: { data?: { error?: { message?: string; code?: number } } };
      message?: string;
    };
    const apiMessage =
      ax.response?.data?.error?.message || ax.message || "Token lookup failed";
    console.error("[verifyViaIdentityToolkit] lookup error:", apiMessage);
    const err = new Error(apiMessage) as Error & { code?: string };
    err.code = "auth/invalid-id-token";
    throw err;
  }

  const user = data?.users?.[0];
  if (!user?.localId) {
    const err = new Error("Invalid token — no user in lookup response") as Error & {
      code?: string;
    };
    err.code = "auth/invalid-id-token";
    throw err;
  }

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

function useRestFirst(): boolean {
  if (!getFirebaseWebApiKey()) return false;
  return (
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production"
  );
}

/**
 * Verify Firebase ID token.
 * On Vercel/production: REST first (Admin verifyIdToken is unreliable there).
 * Locally: Admin SDK first, REST fallback.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  checkRevoked = false,
): Promise<DecodedIdToken> {
  if (useRestFirst()) {
    try {
      return await verifyViaIdentityToolkit(idToken);
    } catch (restError) {
      const err = restError as { code?: string; message?: string };
      console.warn(
        "[verifyFirebaseIdToken] REST failed on production, trying Admin SDK:",
        err?.code || "unknown",
        err?.message?.slice(0, 120),
      );
    }
  }

  try {
    return await auth.verifyIdToken(idToken, checkRevoked);
  } catch (adminError) {
    const err = adminError as { code?: string; message?: string };
    console.warn(
      "[verifyFirebaseIdToken] Admin SDK failed, using REST fallback:",
      err?.code || "unknown",
      err?.message?.slice(0, 120),
    );
    return verifyViaIdentityToolkit(idToken);
  }
}
