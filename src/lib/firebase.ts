import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Validate config
const isConfigValid = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
  console.error("Firebase configuration is missing or invalid. Check firebase-applet-config.json");
}

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder"
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
