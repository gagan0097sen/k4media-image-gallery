const admin = require('firebase-admin');

let isFirebaseInitialized = false;
let serviceAccount;

try {
   const fs = require('fs');

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Loading Firebase from FIREBASE_SERVICE_ACCOUNT env var...');
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ' + err.message);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    console.log('Loading Firebase from file path:', p);
    if (!fs.existsSync(p)) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH file not found: ' + p);
    }
    try {
      const fileContents = fs.readFileSync(p, 'utf8');
      serviceAccount = JSON.parse(fileContents);
    } catch (err) {
      throw new Error('Failed to read/parse service account file: ' + err.message);
    }
  } else {
    // For local development, construct from individual env vars
    console.log('Loading Firebase from individual env vars...');

    // Some env setups store the PRIVATE_KEY with surrounding quotes or escaped newlines.
    // Normalize it here: remove surrounding quotes and convert literal \n to actual newlines.
    let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    // Remove surrounding double-quotes if present
    if (rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) {
      rawPrivateKey = rawPrivateKey.slice(1, -1);
    }
    // Replace escaped newlines with real newlines
    const normalizedPrivateKey = rawPrivateKey.replace(/\\n/g, '\n');

    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: normalizedPrivateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || 'firebase-admin-sdk',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    };
  }

  // Validate required credentials
  const hasProjectId = !!serviceAccount?.project_id;
  const hasPrivateKey = !!serviceAccount?.private_key;
  const hasClientEmail = !!serviceAccount?.client_email;

  console.log('Firebase credentials check:');
  console.log('  ✓ Project ID:', hasProjectId ? '✓' : '❌');
  console.log('  ✓ Private Key:', hasPrivateKey ? '✓' : '❌');
  console.log('  ✓ Client Email:', hasClientEmail ? '✓' : '❌');

  // Only initialize if we have required credentials
  if (hasProjectId && hasPrivateKey && hasClientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log('✓ Firebase Admin SDK initialized successfully');
  } else {
    console.warn('⚠ Firebase credentials incomplete - Firebase authentication disabled');
    console.warn('Make sure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set');
  }
} catch (error) {
  console.warn('⚠ Firebase initialization error:', error.message);
  console.warn('Firebase Admin SDK will be disabled');
  if (process.env.NODE_ENV === 'development') {
    console.warn('For development, ensure .env file has proper Firebase credentials');
  }
}

const verifyFirebaseToken = async (token) => {
  try {
    console.log('token--', token);
    if (!isFirebaseInitialized || !admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Firebase token verified for uid:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

const getFirebaseAdmin = () => {
  if (!isFirebaseInitialized) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return admin;
};

module.exports = {
  admin,
  verifyFirebaseToken,
  getFirebaseAdmin,
  isFirebaseInitialized,
};
