import admin from "firebase-admin";

// Hardcoded Firebase Service Account Credentials
// NOTE: This is a direct solution - credentials are embedded in code
// Using 'as any' to match the JSON structure from Firebase
const serviceAccount = {
  type: "service_account",
  project_id: "tray-ed2f7",
  private_key_id: "72f6bb86847c83b0deba9621f26807bb08c81edc",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9zA5Ya/uMQNyU\nrCYXA9+ujI2NoGyQdwI5Q+SUwcve7skI0sbxxaq7OSiqzfMtWXe9jAUeS6jnC4R/\nT8PGbkLDLAOsc9puh9sw+YtWStP2tVO3k5PrlxY40U/hCwasdIoIvDc02+2FM6MS\nInEOPNMjqCAZ1qFC3CytOQ1TA57Yn+vDFglFpkNQtJ6hMizSbCpu6dKeaAoG2BYz\nWQTSrboa15fgfBUiXLjgumVJ0WA187TbsxiZk495Hlff2Ac6rEy7Kq0NdCHI2wDO\n9FNCoKfLdSolhQ6awJIYKh5Le94YlqfdOdmfg71msZ5otfGEZ0n4jFBXvmOpgkLL\ndY2mxBTBAgMBAAECgf8FFBca+ci0hNSVWQXfF8g+CdGMnv5IrBm8u1RVpqandtXQ\npp/48cRGJJr+w9DKv3O0xRcqxShMn/V4cp0kC7WkA0l8RwO3pJ4sCue8WpEElbvn\numTHqQNIzrdhQV15Jj6+fReWrBiiHjLLowawNHBx3Wdk4zLtcKn0kjiipmlZr0hP\n2GiJc+N3fxBsQFgJIpaewjhA8FNtjVWZmCVpqJX0DLC7aaRNEJbIyb8k4J+oBN+y\nAuPhy1SLmY7RyZuH2T5NGXLiaEZowSiWM+IqMKsPxHeMuRxtntQ5jJKTfbvfmg5u\nQ9AXEDg2QJI9ngJDgBRD5YXtdBYmdveDROVlfbECgYEA9O5NbjaDYCgEt7Jkwp40\nsMdXGk5addsf4hK20BYu2Dm7pZfFWCdwn6zqcAwdTKERKP1EWU6B0WHdLBpfM3XB\n621vmpBC3tTYnP+8SBzbR1KgXV3KTsIU7sFEYUhA6bwPYdwx6MFmMm073bAGQdmB\nlGpDpkXJYHptAwsliyktPkkCgYEAxl/j4NxFcHIguzy0fz5YNjAXxO6RJUxPGePD\n/GoaCK1WHBRHmPbwNUOeN099OY+NVSQgzn4aoJUyGjtdqByCtWZK9TI4YholOwbb\nuiTj6NExKZHpECX52bUlXqNrKgGAjapHtsEbUBpHqpAB7C1bsxtWLdcJCoT+L8Zx\nUGPpgrkCgYEA1LU7s3JOJ6y5ZBreHJIuajPD9kmDkASrrLbZ4t7Q8eE5kDa9ILCn\nw1P1CTfMHidm8rT4raJbZU5bOJjygotKzL1uhcmw+TnZoIcLqYi9+jPMpyjzr/An\nI63eR6nrDdHPfgovodaLfVGWAxGCbZ+KRC0A8R58I3hOwazlfvRUoVkCgYEAramy\nl96d16PB7chmB2Lv3HhbxqZHYMyeDv8rSuUj52a/lJNYXpwHi8mnT6qB6Qs34kpf\nggY5j00tcHN6OTrEXsOvaVpOq+tRnowRfbLf5qiEDm1TCDUGtsVzcpdDsKFiBiME\n5wPEwmpPRQ0O8dB/j5ul5Tl0C8aDtBVYi9T7ztkCgYEAn4B933WaNI7mwiGFo2KT\nzqf8x1/xi3x1tYN5BHfbpjVellNHdST6JJkZ3mztHa1m8gxaeidNuJX4Disuuwk3\nV4f8kBoGgbc4jtYnq8wVkxEhoAsGQRFVQKg/2FYn4e3Rrkdtbyp2iydAc1f3jH6T\nyZnqFQJr90Zr+4nvEKDfl7I=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@tray-ed2f7.iam.gserviceaccount.com",
  client_id: "115013495212439306518",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tray-ed2f7.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
} as admin.ServiceAccount;

// Initialize Firebase Admin SDK with hardcoded credentials
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized with hardcoded credentials");
    console.log(`✅ Project: ${serviceAccount.projectId || (serviceAccount as any).project_id}`);
  } catch (error: any) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error?.message || error);
    throw error;
  }
}

// Initialize Firestore with optimized settings
const db = admin.firestore();

// OPTIMIZATION: Configure Firestore settings for better performance
// These settings help with connection pooling and reduce latency
db.settings({
  // Use persistent connection (default, but explicit for clarity)
  ignoreUndefinedProperties: true, // Ignore undefined properties to avoid errors
  // Enable offline persistence for better performance (caching)
  // Note: Admin SDK doesn't support offline persistence, but we handle caching in our code
});

// Validate Firebase credentials work (async check)
if (process.env.NODE_ENV !== 'test') {
  setImmediate(async () => {
    try {
      // Test that credentials actually work by making a lightweight API call
      await db.collection('_health_check').limit(1).get();
      console.log('✅ [Firebase] Credentials validated successfully');
    } catch (error: any) {
      // If this is an authentication error, it means credentials are invalid
      if (error?.code === 16 || error?.message?.includes('UNAUTHENTICATED') || error?.message?.includes('authentication')) {
        console.error('❌ [Firebase] Authentication error:', error?.message || 'Unknown authentication error');
        // Don't throw here as it's async - the health check will catch it
      } else {
        // Other errors (like collection doesn't exist) are OK
        console.log('ℹ️ [Firebase] Credential validation skipped (non-auth error, expected)');
      }
    }
  });
}

// OPTIMIZATION: Pre-warm Firestore connection by making a lightweight test query
// This reduces cold start latency for the first real query
if (process.env.NODE_ENV !== 'test') {
  // Run async without blocking server startup
  setImmediate(async () => {
    try {
      // Make a lightweight query to establish connection
      await db.collection('_test').doc('connection').get();
      console.log('✅ [Firestore] Connection pre-warmed');
    } catch (error) {
      // Ignore errors - this is just for optimization
      console.log('ℹ️ [Firestore] Pre-warm skipped (expected if _test collection doesn\'t exist)');
    }
  });
}

// Initialize Auth and Storage
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };
