const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const path = require('path');

try {
    let credential = null;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        credential = cert(require(serviceAccountPath));
    } else {
        console.warn("WARNING: Firebase Admin credentials not specified in environment variables.");
        console.warn("Please configure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.");
    }

    if (credential) {
        initializeApp({
            credential: credential
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } else {
        // Fallback initialization with project ID for token verification
        initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'healtrack-0001'
        });
        console.log("Firebase Admin SDK initialized with Project ID fallback.");
    }
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
}

module.exports = admin;

