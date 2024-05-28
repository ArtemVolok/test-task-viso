import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCS7feAVJLDp9eZpy7II5ALD7zldFkLMng",
  authDomain: "test-task-viso-e675c.firebaseapp.com",
  projectId: "test-task-viso-e675c",
  storageBucket: "test-task-viso-e675c.appspot.com",
  messagingSenderId: "636965829368",
  appId: "1:636965829368:web:a41a27d7d0a90ad886590d",
  measurementId: "G-NH008PJVRR",
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
