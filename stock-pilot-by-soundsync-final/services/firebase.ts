
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { UserProfile } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyDWBos5f3koVvfnJ5otTvHVIzD4QDGNvjU",
  authDomain: "studio-8371121982-c36f9.firebaseapp.com",
  projectId: "studio-8371121982-c36f9",
  storageBucket: "studio-8371121982-c36f9.firebasestorage.app",
  messagingSenderId: "939482534019",
  appId: "1:939482534019:web:0ef3816f1c10398559cbb6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Creates or updates a user's profile document in Firestore.
 * It merges the provided data with any existing document.
 * @param uid The user's ID.
 * @param profileData A partial or full UserProfile object.
 */
export const setUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, profileData, { merge: true });
};

export const getUserProfile = async (uid:string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
}

/**
 * Finds users of a specific role who are associated with any of the provided categories.
 * @param categories An array of category strings to match against.
 * @param role The role to filter by ('seller' or 'supplier').
 * @returns A promise that resolves to an array of matching UserProfile objects.
 */
export const findUsersByCategories = async (categories: string[], role: 'seller' | 'supplier'): Promise<UserProfile[]> => {
    if (!categories || categories.length === 0) return [];
    
    const usersRef = collection(db, 'users');
    // Firestore 'array-contains-any' queries are limited to 10 elements in the array.
    // For this app's scale, we'll query on the first 10 selected categories.
    const categoriesToQuery = categories.slice(0, 10);
    
    const q = query(usersRef, where('role', '==', role), where('categories', 'array-contains-any', categoriesToQuery));
    
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
    });
    return users;
};
