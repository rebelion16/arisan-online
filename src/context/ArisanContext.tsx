import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Arisan, Member, Payment, Round, CreateArisanFormData, PaymentAccount, ArisanSettings, DrawRecord } from '../types';
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
    getArisanByInviteCode: (code: string) => Promise<Arisan | null>;
    getUserArisans: () => Arisan[];
    createArisan: (data: CreateArisanFormData) => Promise<Arisan>;
    deleteArisan: (arisanId: string) => Promise<void>;
    updateArisan: (arisanId: string, data: Partial<Arisan>) => Promise<void>;
    updateSettings: (arisanId: string, settings: Partial<ArisanSettings>) => Promise<void>;
    joinArisan: (inviteCode: string, contributionAmount?: number, name?: string, phone?: string) => Promise<boolean>;
    updateMemberOrder: (arisanId: string, memberId: string, direction: 'up' | 'down') => Promise<void>;
    removeMember: (arisanId: string, memberId: string) => Promise<void>;
    updateMemberRole: (arisanId: string, memberId: string, role: Member['role']) => Promise<void>;
    randomDrawOrder: (arisanId: string) => Promise<DrawRecord | null>;
    startNewRound: (arisanId: string) => Promise<void>;
    submitPayment: (arisanId: string, memberId: string, round: number) => Promise<boolean>;
    approvePayment: (arisanId: string, memberId: string, round: number) => Promise<boolean>;
    confirmPayment: (arisanId: string, memberId: string, round: number) => Promise<boolean>;
    getPaymentsByRound: (arisanId: string, round: number) => Payment[];
    getRoundHistory: (arisanId: string) => Round[];
    addPaymentAccount: (arisanId: string, account: Omit<PaymentAccount, 'id'>) => Promise<void>;
    removePaymentAccount: (arisanId: string, accountId: string) => Promise<void>;
    refreshArisans: () => Promise<void>;
}

const ArisanContext = createContext<ArisanContextType | undefined>(undefined);

// Helper functions
const toDate = (timestamp: Timestamp | Date | undefined | null): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp;
};

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const defaultSettings: ArisanSettings = {
    penaltyEnabled: false,
    penaltyType: 'percentage',
    penaltyAmount: 0,
    reminderEnabled: true,
    reminderDays: [-3, -1, 0],
    reminderTime: '09:00',
};

export const ArisanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [arisans, setArisans] = useState<Arisan[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [currentArisan, setCurrentArisan] = useState<Arisan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user's arisans from Firestore
    const fetchUserArisans = useCallback(async () => {
        if (!user) {
            setArisans([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Get arisans created by user
            const createdQuery = query(collection(db, 'arisans'), where('createdBy', '==', user.id));
            const createdSnap = await getDocs(createdQuery);

            const arisanList: Arisan[] = [];

            for (const docSnap of createdSnap.docs) {
                const data = docSnap.data();
                // Get members subcollection
                const membersSnap = await getDocs(collection(db, 'arisans', docSnap.id, 'members'));
                const members: Member[] = membersSnap.docs.map(m => ({
                    id: m.id,
                    ...m.data(),
                    joinedAt: toDate(m.data().joinedAt),
                })) as Member[];

                arisanList.push({
                    id: docSnap.id,
                    ...data,
                    createdAt: toDate(data.createdAt),
                    dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
                    members,
                    paymentAccounts: data.paymentAccounts || [],
                    settings: data.settings || defaultSettings,
                } as Arisan);
            }

            // Get arisans where user is a member
            const memberQuery = query(collection(db, 'memberships'), where('userId', '==', user.id));
            const memberSnap = await getDocs(memberQuery);

            for (const memberDoc of memberSnap.docs) {
                const arisanId = memberDoc.data().arisanId;
                if (!arisanList.find(a => a.id === arisanId)) {
                    const arisanDoc = await getDoc(doc(db, 'arisans', arisanId));
                    if (arisanDoc.exists()) {
                        const data = arisanDoc.data();
                        const membersSnap = await getDocs(collection(db, 'arisans', arisanId, 'members'));
                        const members: Member[] = membersSnap.docs.map(m => ({
                            id: m.id,
                            ...m.data(),
                            joinedAt: toDate(m.data().joinedAt),
                        })) as Member[];

                        arisanList.push({
                            id: arisanDoc.id,
                            ...data,
                            createdAt: toDate(data.createdAt),
                            dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
                            members,
                            paymentAccounts: data.paymentAccounts || [],
                            settings: data.settings || defaultSettings,
                        } as Arisan);
                    }
                }
            }

            setArisans(arisanList);

            // Fetch payments
            const paymentsQuery = query(collection(db, 'payments'), where('userId', '==', user.id));
            const paymentsSnap = await getDocs(paymentsQuery);
            const paymentsList = paymentsSnap.docs.map(p => ({
                id: p.id,
                ...p.data(),
                submittedAt: p.data().submittedAt ? toDate(p.data().submittedAt) : undefined,
                approvedAt: p.data().approvedAt ? toDate(p.data().approvedAt) : undefined,
                paidAt: p.data().paidAt ? toDate(p.data().paidAt) : undefined,
            })) as Payment[];
            setPayments(paymentsList);

            // Fetch rounds for user's arisans
            const roundsList: Round[] = [];
            for (const arisan of arisanList) {
                const roundsQuery = query(collection(db, 'rounds'), where('arisanId', '==', arisan.id));
                const roundsSnap = await getDocs(roundsQuery);
                roundsSnap.docs.forEach(r => {
                    roundsList.push({
                        id: r.id,
                        ...r.data(),
                        dueDate: toDate(r.data().dueDate),
                        completedAt: r.data().completedAt ? toDate(r.data().completedAt) : undefined,
                    } as Round);
                });
            }
            setRounds(roundsList);
        } catch (error) {
            console.error('Error fetching arisans:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserArisans();
    }, [fetchUserArisans]);

    const refreshArisans = async () => {
        await fetchUserArisans();
    };

    const getArisanById = (id: string): Arisan | undefined => {
        return arisans.find(a => a.id === id);
    };

    const getArisanByInviteCode = async (code: string): Promise<Arisan | null> => {
        const q = query(collection(db, 'arisans'), where('inviteCode', '==', code.toUpperCase()));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        const membersSnap = await getDocs(collection(db, 'arisans', docSnap.id, 'members'));
        const members: Member[] = membersSnap.docs.map(m => ({
            id: m.id,
            ...m.data(),
            joinedAt: toDate(m.data().joinedAt),
        })) as Member[];

        return {
            id: docSnap.id,
            ...data,
            createdAt: toDate(data.createdAt),
            dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
            members,
            paymentAccounts: data.paymentAccounts || [],
            settings: data.settings || defaultSettings,
        } as Arisan;
    };

    const getUserArisans = (): Arisan[] => {
        return arisans;
    };

    const createArisan = async (data: CreateArisanFormData): Promise<Arisan> => {
        if (!user) throw new Error('User not authenticated');

        const inviteCode = generateInviteCode();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (data.period === 'mingguan' ? 7 : 30));

        // Create arisan document
        const arisanRef = await addDoc(collection(db, 'arisans'), {
            name: data.name,
            nominal: data.nominal,
            period: data.period,
            totalMembers: data.totalMembers,
            currentRound: 1,
            status: 'aktif',
            turnMethod: data.turnMethod,
            inviteCode,
            dueDate: Timestamp.fromDate(dueDate),
            createdBy: user.id,
            createdAt: serverTimestamp(),
            paymentAccounts: data.paymentAccounts || [],
            settings: defaultSettings,
        });

        // Add members as subcollection
        for (const member of data.members) {
            await addDoc(collection(db, 'arisans', arisanRef.id, 'members'), {
                name: member.name,
                phone: member.phone || '',
                role: member.role,
                turnOrder: member.turnOrder,
                contributionAmount: member.contributionAmount || data.nominal,
                userId: member.role === 'ketua' ? user.id : null,
                status: 'active',
                joinedAt: serverTimestamp(),
            });

            // Add to memberships collection for querying
            if (member.role === 'ketua') {
                await addDoc(collection(db, 'memberships'), {
                    userId: user.id,
                    arisanId: arisanRef.id,
                    joinedAt: serverTimestamp(),
                });
            }
        }

        // Create first round
        const winner = data.members.find(m => m.turnOrder === 1);
        await addDoc(collection(db, 'rounds'), {
            arisanId: arisanRef.id,
            roundNumber: 1,
            winnerId: winner?.name || '',
            winnerName: winner?.name || '',
            dueDate: Timestamp.fromDate(dueDate),
            totalCollected: 0,
            payments: [],
        });

        // Create pending payments for all members
        for (const member of data.members) {
            await addDoc(collection(db, 'payments'), {
                arisanId: arisanRef.id,
                memberId: member.name, // Using name as we don't have member IDs yet
                round: 1,
                amount: member.contributionAmount || data.nominal,
                status: 'pending',
                userId: member.role === 'ketua' ? user.id : null,
            });
        }

        // Refresh and return
        await fetchUserArisans();
        const newArisan = arisans.find(a => a.id === arisanRef.id);
        if (!newArisan) {
            // Return a minimal arisan object if not found in state yet
            return {
                id: arisanRef.id,
                name: data.name,
                nominal: data.nominal,
                period: data.period,
                totalMembers: data.totalMembers,
                currentRound: 1,
                status: 'aktif',
                turnMethod: data.turnMethod,
                inviteCode,
                dueDate,
                createdBy: user.id,
                createdAt: new Date(),
                members: data.members.map((m, i) => ({
                    id: `temp-${i}`,
                    name: m.name,
                    phone: m.phone || '',
                    role: m.role,
                    turnOrder: m.turnOrder,
                    contributionAmount: m.contributionAmount || data.nominal,
                    status: 'active',
                    joinedAt: new Date(),
                })),
                paymentAccounts: data.paymentAccounts || [],
                settings: defaultSettings,
            };
        }
        return newArisan;
    };

    const deleteArisan = async (arisanId: string): Promise<void> => {
        // Delete members subcollection
        const membersSnap = await getDocs(collection(db, 'arisans', arisanId, 'members'));
        const batch = writeBatch(db);
        membersSnap.docs.forEach(doc => batch.delete(doc.ref));

        // Delete arisan
        batch.delete(doc(db, 'arisans', arisanId));
        await batch.commit();

        // Delete related payments and rounds
        const paymentsQuery = query(collection(db, 'payments'), where('arisanId', '==', arisanId));
        const paymentsSnap = await getDocs(paymentsQuery);
        for (const p of paymentsSnap.docs) {
            await deleteDoc(p.ref);
        }

        const roundsQuery = query(collection(db, 'rounds'), where('arisanId', '==', arisanId));
        const roundsSnap = await getDocs(roundsQuery);
        for (const r of roundsSnap.docs) {
            await deleteDoc(r.ref);
        }

        // Delete memberships
        const membershipQuery = query(collection(db, 'memberships'), where('arisanId', '==', arisanId));
        const membershipSnap = await getDocs(membershipQuery);
        for (const m of membershipSnap.docs) {
            await deleteDoc(m.ref);
        }

        setArisans(prev => prev.filter(a => a.id !== arisanId));
    };

    const updateArisan = async (arisanId: string, data: Partial<Arisan>): Promise<void> => {
        const updateData: Record<string, unknown> = { ...data };
        delete updateData.id;
        delete updateData.members;
        if (data.dueDate) {
            updateData.dueDate = Timestamp.fromDate(data.dueDate);
        }
        await updateDoc(doc(db, 'arisans', arisanId), updateData);
        setArisans(prev => prev.map(a => a.id === arisanId ? { ...a, ...data } : a));
    };

    const updateSettings = async (arisanId: string, settings: Partial<ArisanSettings>): Promise<void> => {
        const arisan = getArisanById(arisanId);
        if (!arisan) return;
        const newSettings = { ...arisan.settings, ...settings };
        await updateDoc(doc(db, 'arisans', arisanId), { settings: newSettings });
        setArisans(prev => prev.map(a => a.id === arisanId ? { ...a, settings: newSettings } : a));
    };

    const joinArisan = async (inviteCode: string, contributionAmount?: number, name?: string, phone?: string): Promise<boolean> => {
        if (!user) return false;

        const arisan = await getArisanByInviteCode(inviteCode);
        if (!arisan) return false;

        // Check if already a member
        if (arisan.members.some(m => m.userId === user.id)) return false;

        // Check if arisan is full
        if (arisan.members.length >= arisan.totalMembers) return false;

        const newMember: Omit<Member, 'id' | 'joinedAt'> = {
            userId: user.id,
            name: name || user.name,
            phone: phone || user.phone || '',
            role: 'anggota',
            turnOrder: arisan.members.length + 1,
            contributionAmount: contributionAmount || arisan.nominal,
            status: 'active',
        };

        await addDoc(collection(db, 'arisans', arisan.id, 'members'), {
            ...newMember,
            joinedAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'memberships'), {
            userId: user.id,
            arisanId: arisan.id,
            joinedAt: serverTimestamp(),
        });

        // Create pending payment for current round
        await addDoc(collection(db, 'payments'), {
            arisanId: arisan.id,
            memberId: newMember.name,
            round: arisan.currentRound,
            amount: newMember.contributionAmount,
            status: 'pending',
            userId: user.id,
        });

        await fetchUserArisans();
        return true;
    };

    const updateMemberOrder = async (arisanId: string, memberId: string, direction: 'up' | 'down'): Promise<void> => {
        const arisan = getArisanById(arisanId);
        if (!arisan) return;

        const members = [...arisan.members].sort((a, b) => a.turnOrder - b.turnOrder);
        const idx = members.findIndex(m => m.id === memberId);
        if (idx === -1) return;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= members.length) return;

        // Swap turn orders
        const temp = members[idx].turnOrder;
        members[idx].turnOrder = members[swapIdx].turnOrder;
        members[swapIdx].turnOrder = temp;

        // Update in Firestore
        await updateDoc(doc(db, 'arisans', arisanId, 'members', members[idx].id), { turnOrder: members[idx].turnOrder });
        await updateDoc(doc(db, 'arisans', arisanId, 'members', members[swapIdx].id), { turnOrder: members[swapIdx].turnOrder });

        setArisans(prev => prev.map(a => a.id === arisanId ? { ...a, members } : a));
    };

    const removeMember = async (arisanId: string, memberId: string): Promise<void> => {
        await deleteDoc(doc(db, 'arisans', arisanId, 'members', memberId));
        setArisans(prev => prev.map(a => {
            if (a.id !== arisanId) return a;
            const members = a.members.filter(m => m.id !== memberId);
            members.forEach((m, i) => { m.turnOrder = i + 1; });
            return { ...a, members };
        }));
    };

    const updateMemberRole = async (arisanId: string, memberId: string, role: Member['role']): Promise<void> => {
        await updateDoc(doc(db, 'arisans', arisanId, 'members', memberId), { role });
        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, members: a.members.map(m => m.id === memberId ? { ...m, role } : m) }
                : a
        ));
    };

    const randomDrawOrder = async (arisanId: string): Promise<DrawRecord | null> => {
        if (!user) return null;
        const arisan = getArisanById(arisanId);
        if (!arisan) return null;

        const shuffled = [...arisan.members].sort(() => Math.random() - 0.5);
        shuffled.forEach((m, i) => { m.turnOrder = i + 1; });

        // Update all members in Firestore
        for (const member of shuffled) {
            await updateDoc(doc(db, 'arisans', arisanId, 'members', member.id), { turnOrder: member.turnOrder });
        }

        const record: DrawRecord = {
            id: generateId(),
            performedAt: new Date(),
            performedBy: user.id,
            result: shuffled.map(m => ({ memberId: m.id, memberName: m.name, turnOrder: m.turnOrder })),
        };

        // Store draw history
        await updateDoc(doc(db, 'arisans', arisanId), {
            drawHistory: [...(arisan.drawHistory || []), record],
        });

        setArisans(prev => prev.map(a =>
            a.id === arisanId
                ? { ...a, members: shuffled, drawHistory: [...(a.drawHistory || []), record] }
                : a
        ));

        return record;
    };

    const startNewRound = async (arisanId: string): Promise<void> => {
        const arisan = getArisanById(arisanId);
        if (!arisan) return;

        const newRoundNumber = arisan.currentRound + 1;
        if (newRoundNumber > arisan.totalMembers) return;

        const nextWinner = arisan.members.find(m => m.turnOrder === newRoundNumber);
        if (!nextWinner) return;

        const newDueDate = new Date(Date.now() + (arisan.period === 'mingguan' ? 7 : 30) * 24 * 60 * 60 * 1000);

        await updateArisan(arisanId, { currentRound: newRoundNumber, dueDate: newDueDate });

        await addDoc(collection(db, 'rounds'), {
            arisanId,
            roundNumber: newRoundNumber,
            winnerId: nextWinner.id,
            winnerName: nextWinner.name,
            dueDate: Timestamp.fromDate(newDueDate),
            totalCollected: 0,
            payments: [],
        });

        for (const member of arisan.members) {
            await addDoc(collection(db, 'payments'), {
                arisanId,
                memberId: member.id,
                round: newRoundNumber,
                amount: member.contributionAmount,
                status: 'pending',
                userId: member.userId,
            });
        }

        await fetchUserArisans();
    };

    const submitPayment = async (arisanId: string, memberId: string, round: number): Promise<boolean> => {
        const q = query(collection(db, 'payments'),
            where('arisanId', '==', arisanId),
            where('memberId', '==', memberId),
            where('round', '==', round)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return false;

        await updateDoc(snapshot.docs[0].ref, {
            status: 'submitted',
            submittedAt: serverTimestamp(),
        });

        setPayments(prev => prev.map(p =>
            p.arisanId === arisanId && p.memberId === memberId && p.round === round
                ? { ...p, status: 'submitted', submittedAt: new Date() }
                : p
        ));

        return true;
    };

    const approvePayment = async (arisanId: string, memberId: string, round: number): Promise<boolean> => {
        const q = query(collection(db, 'payments'),
            where('arisanId', '==', arisanId),
            where('memberId', '==', memberId),
            where('round', '==', round)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return false;

        await updateDoc(snapshot.docs[0].ref, {
            status: 'approved',
            approvedAt: serverTimestamp(),
        });

        setPayments(prev => prev.map(p =>
            p.arisanId === arisanId && p.memberId === memberId && p.round === round
                ? { ...p, status: 'approved', approvedAt: new Date() }
                : p
        ));

        return true;
    };

    const confirmPayment = async (arisanId: string, memberId: string, round: number): Promise<boolean> => {
        return approvePayment(arisanId, memberId, round);
    };

    const getPaymentsByRound = (arisanId: string, round: number): Payment[] => {
        return payments.filter(p => p.arisanId === arisanId && p.round === round);
    };

    const getRoundHistory = (arisanId: string): Round[] => {
        return rounds.filter(r => r.arisanId === arisanId);
    };

    const addPaymentAccount = async (arisanId: string, account: Omit<PaymentAccount, 'id'>): Promise<void> => {
        const arisan = getArisanById(arisanId);
        if (!arisan) return;

        const newAccount: PaymentAccount = { ...account, id: generateId() };
        const updatedAccounts = [...arisan.paymentAccounts, newAccount];

        await updateDoc(doc(db, 'arisans', arisanId), { paymentAccounts: updatedAccounts });
        setArisans(prev => prev.map(a => a.id === arisanId ? { ...a, paymentAccounts: updatedAccounts } : a));
    };

    const removePaymentAccount = async (arisanId: string, accountId: string): Promise<void> => {
        const arisan = getArisanById(arisanId);
        if (!arisan) return;

        const updatedAccounts = arisan.paymentAccounts.filter(acc => acc.id !== accountId);
        await updateDoc(doc(db, 'arisans', arisanId), { paymentAccounts: updatedAccounts });
        setArisans(prev => prev.map(a => a.id === arisanId ? { ...a, paymentAccounts: updatedAccounts } : a));
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
                refreshArisans,
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
