import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'arisan_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Listen to Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const appUser: User = {
                            id: fbUser.uid,
                            name: userData.name || fbUser.displayName || 'User',
                            email: userData.email || fbUser.email || '',
                            phone: userData.phone || '',
                            avatar: userData.avatar,
                            createdAt: userData.createdAt?.toDate() || new Date(),
                        };
                        setUser(appUser);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
                    } else {
                        // Create user document if doesn't exist
                        const newUser: User = {
                            id: fbUser.uid,
                            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                            email: fbUser.email || '',
                            phone: '',
                            createdAt: new Date(),
                        };
                        await setDoc(doc(db, 'users', fbUser.uid), {
                            ...newUser,
                            createdAt: serverTimestamp(),
                        });
                        setUser(newUser);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    // Fallback to basic user info
                    const basicUser: User = {
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                        email: fbUser.email || '',
                        phone: '',
                        createdAt: new Date(),
                    };
                    setUser(basicUser);
                }
            } else {
                setUser(null);
                localStorage.removeItem(STORAGE_KEY);
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: unknown) {
            const firebaseError = error as { code?: string; message?: string };
            let errorMessage = 'Login gagal. Silakan coba lagi.';

            switch (firebaseError.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Email tidak terdaftar.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Password salah.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Format email tidak valid.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Email atau password salah.';
                    break;
            }

            return { success: false, error: errorMessage };
        }
    };

    const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const fbUser = result.user;

            // Immediately set user state to prevent double-click issue
            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            let appUser: User;

            if (userDoc.exists()) {
                const userData = userDoc.data();
                appUser = {
                    id: fbUser.uid,
                    name: userData.name || fbUser.displayName || 'User',
                    email: userData.email || fbUser.email || '',
                    phone: userData.phone || '',
                    avatar: userData.avatar || fbUser.photoURL || undefined,
                    createdAt: userData.createdAt?.toDate() || new Date(),
                };
            } else {
                // Create user document for new Google user
                appUser = {
                    id: fbUser.uid,
                    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                    email: fbUser.email || '',
                    phone: '',
                    avatar: fbUser.photoURL || undefined,
                    createdAt: new Date(),
                };
                await setDoc(doc(db, 'users', fbUser.uid), {
                    name: appUser.name,
                    email: appUser.email,
                    phone: '',
                    avatar: appUser.avatar,
                    createdAt: serverTimestamp(),
                });
            }

            // Set user state immediately
            setUser(appUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));

            return { success: true };
        } catch (error: unknown) {
            console.error('Google login error:', error); // Log full error for debugging
            const firebaseError = error as { code?: string; message?: string };
            let errorMessage = 'Login dengan Google gagal. Silakan coba lagi.';

            switch (firebaseError.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Popup ditutup sebelum login selesai.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Popup diblokir oleh browser. Izinkan popup untuk login.';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'Login dibatalkan.';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'Akun dengan email ini sudah terdaftar dengan metode lain.';
                    break;
                case 'auth/unauthorized-domain':
                    errorMessage = 'Domain tidak diizinkan. Tambahkan localhost ke Authorized domains di Firebase Console.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Google Sign-In belum diaktifkan di Firebase Console.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Koneksi internet bermasalah. Coba lagi.';
                    break;
                default:
                    errorMessage = `Login gagal: ${firebaseError.code || firebaseError.message || 'Unknown error'}`;
            }

            return { success: false, error: errorMessage };
        }
    };

    const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                phone: '',
                createdAt: serverTimestamp(),
            });

            return { success: true };
        } catch (error: unknown) {
            const firebaseError = error as { code?: string; message?: string };
            let errorMessage = 'Registrasi gagal. Silakan coba lagi.';

            switch (firebaseError.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email sudah terdaftar.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password terlalu lemah. Minimal 6 karakter.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Format email tidak valid.';
                    break;
            }

            return { success: false, error: errorMessage };
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                isAuthenticated: !!user,
                isLoading,
                login,
                loginWithGoogle,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
