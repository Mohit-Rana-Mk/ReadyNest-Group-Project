const admin = require('firebase-admin');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const path = require('path');

try {
    if (getApps().length === 0) {
        let credential = null;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim() !== '' && process.env.FIREBASE_SERVICE_ACCOUNT_JSON !== 'undefined') {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
                credential = cert(serviceAccount);
                console.log("Firebase credentials successfully parsed from FIREBASE_SERVICE_ACCOUNT_JSON.");
            } catch (jsonErr) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", jsonErr.message);
            }
        }
        
        if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            try {
                const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
                credential = cert(require(serviceAccountPath));
                console.log(`Firebase credentials loaded from path: ${serviceAccountPath}`);
            } catch (pathErr) {
                console.error("Failed to load Firebase credentials from path:", pathErr.message);
            }
        }

        if (credential) {
            initializeApp({
                credential: credential
            });
            console.log("Firebase Admin SDK initialized successfully.");
        } else {
            console.warn("WARNING: Firebase Admin credentials not specified or failed to load.");
            console.warn("Initializing Firebase Admin SDK with Project ID fallback.");
            initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || 'healtrack-0001'
            });
        }
    } else {
        console.log("Firebase Admin SDK already initialized.");
    }
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
}

module.exports = admin;

