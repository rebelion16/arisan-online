import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { Arisan, Member, Payment, Round, CreateArisanFormData, PaymentAccount, ArisanSettings, DrawRecord } from '../types';
import { mockArisans, mockPayments, mockRounds, generateId, generateInviteCode } from '../data/mockData';
import { useAuth } from './AuthContext';

interface ArisanContextType {
    arisans: Arisan[];
    currentArisan: Arisan | null;
    payments: Payment[];
    rounds: Round[];
    isLoading: boolean;

    // Actions
    setCurrentArisan: (arisan: Arisan | null) => void;
    getArisanById: (id: string) => Arisan | undefined;
    getArisanByInviteCode: (code: string) => Arisan | undefined;
    getUserArisans: () => Arisan[];
    createArisan: (data: CreateArisanFormData) => Promise<Arisan>;
    deleteArisan: (arisanId: string) => void;
    updateArisan: (arisanId: string, data: Partial<Arisan>) => void;
    updateSettings: (arisanId: string, settings: Partial<ArisanSettings>) => void;
    joinArisan: (inviteCode: string, contributionAmount?: number, name?: string, phone?: string) => Promise<boolean>;
    updateMemberOrder: (arisanId: string, memberId: string, direction: 'up' | 'down') => void;
    removeMember: (arisanId: string, memberId: string) => void;
    updateMemberRole: (arisanId: string, memberId: string, role: Member['role']) => void;
    randomDrawOrder: (arisanId: string) => DrawRecord | null;
    startNewRound: (arisanId: string) => void;
    submitPayment: (arisanId: string, memberId: string, round: number) => Promise<boolean>;
    approvePayment: (arisanId: string, memberId: string, round: number) => Promise<boolean>;
    confirmPayment: (arisanId: string, memberId: string, round: number) => Promise<boolean>;
    getPaymentsByRound: (arisanId: string, round: number) => Payment[];
    getRoundHistory: (arisanId: string) => Round[];
    addPaymentAccount: (arisanId: string, account: Omit<PaymentAccount, 'id'>) => void;
    removePaymentAccount: (arisanId: string, accountId: string) => void;
}

const ArisanContext = createContext<ArisanContextType | undefined>(undefined);

const STORAGE_KEY = 'arisan_data';

export const ArisanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [arisans, setArisans] = useState<Arisan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [currentArisan, setCurrentArisan] = useState<Arisan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from localStorage or use mock data
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setArisans(data.arisans || mockArisans);
                setPayments(data.payments || mockPayments);
                setRounds(data.rounds || mockRounds);
            } catch {
                setArisans(mockArisans);
                setPayments(mockPayments);
                setRounds(mockRounds);
            }
        } else {
            setArisans(mockArisans);
            setPayments(mockPayments);
            setRounds(mockRounds);
        }
        setIsLoading(false);
    }, []);

    // Save to localStorage when data changes
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ arisans, payments, rounds }));
        }
    }, [arisans, payments, rounds, isLoading]);

    const getArisanById = (id: string): Arisan | undefined => {
        return arisans.find(a => a.id === id);
    };

    const getArisanByInviteCode = (code: string): Arisan | undefined => {
        return arisans.find(a => a.inviteCode.toUpperCase() === code.toUpperCase());
    };

    const getUserArisans = (): Arisan[] => {
        if (!user) return [];
        return arisans.filter(arisan =>
            arisan.createdBy === user.id ||
            arisan.members.some(m => m.userId === user.id)
        );
    };

    const createArisan = async (data: CreateArisanFormData): Promise<Arisan> => {
        if (!user) throw new Error('User not authenticated');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const newArisan: Arisan = {
            id: generateId(),
            name: data.name,
            nominal: data.nominal,
            period: data.period,
            totalMembers: data.totalMembers,
            currentRound: 1,
            status: 'aktif',
            turnMethod: data.turnMethod,
            inviteCode: generateInviteCode(),
            createdBy: user.id,
            createdAt: new Date(),
            paymentAccounts: [],
            settings: {
                penaltyEnabled: false,
                penaltyType: 'percentage',
                penaltyAmount: 1,
                reminderEnabled: true,
                reminderDays: [-3, -1, 0],
                reminderTime: '09:00',
            },
            members: data.members.map((m, index) => ({
                ...m,
                id: generateId(),
                joinedAt: new Date(),
                status: 'active' as const,
                turnOrder: data.turnOrder.indexOf(m.name) + 1 || index + 1,
            })),
        };

        setArisans(prev => [...prev, newArisan]);

        // Create initial payments for round 1
        const initialPayments: Payment[] = newArisan.members.map(member => ({
            id: generateId(),
            arisanId: newArisan.id,
            memberId: member.id,
            round: 1,
            amount: newArisan.nominal,
            status: 'pending',
        }));
        setPayments(prev => [...prev, ...initialPayments]);

        // Create initial round
        const initialRound: Round = {
            id: generateId(),
            arisanId: newArisan.id,
            roundNumber: 1,
            winnerId: newArisan.members[0]?.id || '',
            winnerName: newArisan.members[0]?.name || '',
            dueDate: new Date(Date.now() + (data.period === 'mingguan' ? 7 : 30) * 24 * 60 * 60 * 1000),
            totalCollected: 0,
            payments: [],
        };
        setRounds(prev => [...prev, initialRound]);

        return newArisan;
    };

    // Delete arisan (admin only)
    const deleteArisan = (arisanId: string) => {
        setArisans(prev => prev.filter(a => a.id !== arisanId));
        setPayments(prev => prev.filter(p => p.arisanId !== arisanId));
        setRounds(prev => prev.filter(r => r.arisanId !== arisanId));
    };

    // Update arisan (admin only)
    const updateArisan = (arisanId: string, data: Partial<Arisan>) => {
        setArisans(prev => prev.map(a =>
            a.id === arisanId ? { ...a, ...data } : a
        ));
    };

    // Update member turn order
    const updateMemberOrder = (arisanId: string, memberId: string, direction: 'up' | 'down') => {
        setArisans(prev => prev.map(arisan => {
            if (arisan.id !== arisanId) return arisan;

            const members = [...arisan.members].sort((a, b) => a.turnOrder - b.turnOrder);
            const memberIndex = members.findIndex(m => m.id === memberId);
            if (memberIndex === -1) return arisan;

            const targetIndex = direction === 'up' ? memberIndex - 1 : memberIndex + 1;
            if (targetIndex < 0 || targetIndex >= members.length) return arisan;

            // Swap turn orders
            const currentOrder = members[memberIndex].turnOrder;
            const targetOrder = members[targetIndex].turnOrder;
            members[memberIndex].turnOrder = targetOrder;
            members[targetIndex].turnOrder = currentOrder;

            return { ...arisan, members };
        }));
    };

    const joinArisan = async (inviteCode: string, contributionAmount?: number, name?: string, phone?: string): Promise<boolean> => {
        if (!user) return false;

        const arisan = getArisanByInviteCode(inviteCode);
        if (!arisan) return false;

        // Check if already a member
        if (arisan.members.some(m => m.userId === user.id)) {
            return true; // Already a member
        }

        // Check if arisan is full
        if (arisan.members.length >= arisan.totalMembers) {
            return false;
        }

        // Add user as new member with custom contribution amount and profile
        const newMember: Member = {
            id: generateId(),
            userId: user.id,
            name: name || user.name,
            phone: phone || user.phone,
            role: 'anggota',
            turnOrder: arisan.members.length + 1,
            contributionAmount: contributionAmount || arisan.nominal,
            joinedAt: new Date(),
            status: 'active',
        };

        setArisans(prev => prev.map(a =>
            a.id === arisan.id
                ? { ...a, members: [...a.members, newMember] }
                : a
        ));

        // Create payment entry for current round
        const payment: Payment = {
            id: generateId(),
            arisanId: arisan.id,
            memberId: newMember.id,
            round: arisan.currentRound,
            amount: arisan.nominal,
            status: 'pending',
        };
        setPayments(prev => [...prev, payment]);

        return true;
    };

    const confirmPayment = async (arisanId: string, memberId: string, round: number): Promise<boolean> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));

        setPayments(prev => prev.map(p =>
            p.arisanId === arisanId && p.memberId === memberId && p.round === round
                ? { ...p, status: 'paid', paidAt: new Date() }
                : p
        ));

        // Update round total
        setRounds(prev => prev.map(r =>
            r.arisanId === arisanId && r.roundNumber === round
                ? { ...r, totalCollected: r.totalCollected + (getArisanById(arisanId)?.nominal || 0) }
                : r
        ));

        return true;
    };

    const getPaymentsByRound = (arisanId: string, round: number): Payment[] => {
        return payments.filter(p => p.arisanId === arisanId && p.round === round);
    };

    const getRoundHistory = (arisanId: string): Round[] => {
        return rounds.filter(r => r.arisanId === arisanId).sort((a, b) => b.roundNumber - a.roundNumber);
    };

    // Submit payment (member submits, waits for admin approval)
    const submitPayment = async (arisanId: string, memberId: string, round: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        setPayments(prev => prev.map(p =>
            p.arisanId === arisanId && p.memberId === memberId && p.round === round
                ? { ...p, status: 'submitted', submittedAt: new Date() }
                : p
        ));
        return true;
    };

    // Approve payment (admin approves submitted payment)
    const approvePayment = async (arisanId: string, memberId: string, round: number): Promise<boolean> => {
        if (!user) return false;
        await new Promise(resolve => setTimeout(resolve, 300));
        setPayments(prev => prev.map(p =>
            p.arisanId === arisanId && p.memberId === memberId && p.round === round
                ? { ...p, status: 'paid', approvedBy: user.id, approvedAt: new Date(), paidAt: new Date() }
                : p
        ));
        // Update round total
        setRounds(prev => prev.map(r =>
            r.arisanId === arisanId && r.roundNumber === round
                ? { ...r, totalCollected: r.totalCollected + (getArisanById(arisanId)?.nominal || 0) }
                : r
        ));
        return true;
    };

    // Add payment account
    const addPaymentAccount = (arisanId: string, account: Omit<PaymentAccount, 'id'>) => {
        const newAccount: PaymentAccount = { ...account, id: generateId() };
        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, paymentAccounts: [...a.paymentAccounts, newAccount] }
                : a
        ));
    };

    // Remove payment account
    const removePaymentAccount = (arisanId: string, accountId: string) => {
        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, paymentAccounts: a.paymentAccounts.filter(acc => acc.id !== accountId) }
                : a
        ));
    };

    // Update arisan settings
    const updateSettings = (arisanId: string, settings: Partial<ArisanSettings>) => {
        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, settings: { ...a.settings, ...settings } }
                : a
        ));
    };

    // Remove member from arisan
    const removeMember = (arisanId: string, memberId: string) => {
        setArisans(prev => prev.map(a => {
            if (a.id !== arisanId) return a;
            const members = a.members.filter(m => m.id !== memberId);
            // Reassign turn orders
            members.forEach((m, i) => { m.turnOrder = i + 1; });
            return { ...a, members };
        }));
    };

    // Update member role
    const updateMemberRole = (arisanId: string, memberId: string, role: Member['role']) => {
        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, members: a.members.map(m => m.id === memberId ? { ...m, role } : m) }
                : a
        ));
    };

    // Random draw for turn order
    const randomDrawOrder = (arisanId: string): DrawRecord | null => {
        if (!user) return null;
        const arisan = getArisanById(arisanId);
        if (!arisan) return null;

        // Shuffle members randomly
        const shuffled = [...arisan.members].sort(() => Math.random() - 0.5);
        shuffled.forEach((m, i) => { m.turnOrder = i + 1; });

        const record: DrawRecord = {
            id: generateId(),
            performedAt: new Date(),
            performedBy: user.id,
            result: shuffled.map(m => ({ memberId: m.id, memberName: m.name, turnOrder: m.turnOrder })),
        };

        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, members: shuffled, drawHistory: [...(a.drawHistory || []), record] }
                : a
        ));

        return record;
    };

    // Start new round
    const startNewRound = (arisanId: string) => {
        const arisan = getArisanById(arisanId);
        if (!arisan) return;

        const newRoundNumber = arisan.currentRound + 1;
        if (newRoundNumber > arisan.totalMembers) return; // Arisan completed

        const nextWinner = arisan.members.find(m => m.turnOrder === newRoundNumber);
        if (!nextWinner) return;

        // Update arisan
        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? {
                    ...a,
                    currentRound: newRoundNumber,
                    dueDate: new Date(Date.now() + (a.period === 'mingguan' ? 7 : 30) * 24 * 60 * 60 * 1000),
                }
                : a
        ));

        // Create new round
        const newRound: Round = {
            id: generateId(),
            arisanId,
            roundNumber: newRoundNumber,
            winnerId: nextWinner.id,
            winnerName: nextWinner.name,
            dueDate: new Date(Date.now() + (arisan.period === 'mingguan' ? 7 : 30) * 24 * 60 * 60 * 1000),
            totalCollected: 0,
            payments: [],
        };
        setRounds(prev => [...prev, newRound]);

        // Create pending payments for all members
        const newPayments: Payment[] = arisan.members.map(member => ({
            id: generateId(),
            arisanId,
            memberId: member.id,
            round: newRoundNumber,
            amount: member.contributionAmount,
            status: 'pending',
        }));
        setPayments(prev => [...prev, ...newPayments]);
    };

    return (
        <ArisanContext.Provider
            value={{
                arisans,
                currentArisan,
                payments,
                rounds,
                isLoading,
                setCurrentArisan,
                getArisanById,
                getArisanByInviteCode,
                getUserArisans,
                createArisan,
                deleteArisan,
                updateArisan,
                updateSettings,
                joinArisan,
                updateMemberOrder,
                removeMember,
                updateMemberRole,
                randomDrawOrder,
                startNewRound,
                submitPayment,
                approvePayment,
                confirmPayment,
                getPaymentsByRound,
                getRoundHistory,
                addPaymentAccount,
                removePaymentAccount,
            }}
        >
            {children}
        </ArisanContext.Provider>
    );
};

export const useArisan = (): ArisanContextType => {
    const context = useContext(ArisanContext);
    if (!context) {
        throw new Error('useArisan must be used within an ArisanProvider');
    }
    return context;
};
