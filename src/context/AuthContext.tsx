import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType extends AuthState {
    login: (email: string) => Promise<boolean>;
    verifyOtp: (otp: string) => Promise<boolean>;
    logout: () => void;
    pendingEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'arisan_user';
const MOCK_OTP = '123456'; // For testing

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser({
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                });
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    // Save user to localStorage when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [user]);

    const login = async (email: string): Promise<boolean> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Store pending email for OTP verification
        setPendingEmail(email);

        // In real app, send OTP to email
        console.log(`🔐 OTP untuk ${email}: ${MOCK_OTP}`);

        return true;
    };

    const verifyOtp = async (otp: string): Promise<boolean> => {
        if (!pendingEmail) return false;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify OTP (mock: accept 123456)
        if (otp !== MOCK_OTP) {
            return false;
        }

        // Check if user exists or create new one
        let existingUser = mockUsers.find(u => u.email === pendingEmail);

        if (!existingUser) {
            // Create new user
            existingUser = {
                id: `user-${Date.now()}`,
                name: pendingEmail.split('@')[0],
                email: pendingEmail,
                phone: '',
                createdAt: new Date(),
            };
        }

        setUser(existingUser);
        setPendingEmail(null);

        return true;
    };

    const logout = () => {
        setUser(null);
        setPendingEmail(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                verifyOtp,
                logout,
                pendingEmail,
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
