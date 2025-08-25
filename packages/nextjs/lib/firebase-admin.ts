import * as admin from "firebase-admin";

// Helper function to properly format the private key
function formatPrivateKey(privateKey: string | undefined): string | undefined {
  if (!privateKey) return undefined;

  // Handle different ways the private key might be stored in env vars
  return privateKey
    .replace(/\\n/g, "\n") // Replace literal \n with actual newlines
    .replace(/\\\\/g, "\\") // Handle escaped backslashes
    .trim();
}

// Function to initialize Firebase Admin (called lazily)
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Get Firebase configuration from environment variables
  const firebaseConfig = {
    type: "service_account" as const,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com",
  };

  // Validate required environment variables
  const requiredVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
    "FIREBASE_CLIENT_X509_CERT_URL",
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    const error = new Error(`Missing Firebase environment variables: ${missingVars.join(", ")}`);
    console.error("Missing required Firebase environment variables:", missingVars);
    throw error;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase admin:", error);
    throw error;
  }
}

// Lazy getter for Firestore database
export function getAdminDb() {
  initializeFirebaseAdmin();
  return admin.firestore();
}

// Export admin for direct access if needed
export { admin };
