
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { auth, getUserProfile, setUserProfile } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, pass: string, role: 'seller' | 'supplier') => Promise<User | null>;
    signInWithGoogle: () => Promise<User | null>;
    logIn: (email: string, pass: string) => Promise<User | null>;
    logOut: () => Promise<void>;
    updateUserProfileState: (profileData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        // Safety timeout to prevent infinite loading screen
        const fallbackTimeout = setTimeout(() => {
            if (isMounted) {
                console.warn("Auth state took too long to resolve. Forcing load completion.");
                setLoading(false);
            }
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    if (isMounted) setUserProfileState(profile);
                } catch (error) {
                    console.error("Failed to fetch user profile:", error);
                    if (isMounted) setUserProfileState(null);
                } finally {
                    clearTimeout(fallbackTimeout);
                    if (isMounted) setLoading(false);
                }
            } else {
                clearTimeout(fallbackTimeout);
                if (isMounted) {
                    setUserProfileState(null);
                    setLoading(false);
                }
            }
        });
        return () => {
            isMounted = false;
            clearTimeout(fallbackTimeout);
            unsubscribe();
        };
    }, []);

    const updateUserProfileState = (profileData: Partial<UserProfile>) => {
        setUserProfileState(prev => prev ? { ...prev, ...profileData } as UserProfile : { ...profileData } as UserProfile);
    };

    const signUp = async (email: string, pass: string, role: 'seller' | 'supplier'): Promise<User | null> => {
       const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
       if (userCredential.user) {
           const { uid } = userCredential.user;
           const newProfile: UserProfile = {
               uid,
               email,
               role,
               name: '',
               categories: [],
               loginMethod: 'email',
               plan: 'free',
               usage: { aiScans: 0, promosGenerated: 0, inventoryCount: 0 }
           };
           await setUserProfile(uid, newProfile);
           setUserProfileState(newProfile);
       }
       return userCredential.user;
    };

    const signInWithGoogle = async (): Promise<User | null> => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const { user } = result;
        const additionalInfo = getAdditionalUserInfo(result);

        if (additionalInfo?.isNewUser) {
            const newProfile: Partial<UserProfile> = {
                uid: user.uid,
                email: user.email || '',
                // Role will be set during onboarding
                name: user.displayName || '', // Pre-fill name if available
                categories: [],
                photoURL: user.photoURL || '',
                loginMethod: 'google',
                plan: 'free',
                usage: { aiScans: 0, promosGenerated: 0, inventoryCount: 0 }
            };
            await setUserProfile(user.uid, newProfile);
            setUserProfileState(newProfile as UserProfile);
        }
        // For existing users, the onAuthStateChanged listener will fetch their profile
        return user;
    };
    
    const logIn = async (email: string, pass: string): Promise<User | null> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        return userCredential.user;
    };
    
    const logOut = async () => {
        await signOut(auth);
    };

    const value = { user, userProfile, loading, signUp, signInWithGoogle, logIn, logOut, updateUserProfileState };

    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
