// Firestore Service - Database Operations
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
    orderBy,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Arisan, Member, Payment, Round, User, ArisanSettings } from '../types';

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    ARISANS: 'arisans',
    MEMBERS: 'members',
    PAYMENTS: 'payments',
    ROUNDS: 'rounds',
};

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: Timestamp | Date | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp;
};

// ==================== USER OPERATIONS ====================

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...userData,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getUserById = async (userId: string): Promise<User | null> => {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: toDate(data.createdAt),
        } as User;
    }
    return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0];
    const data = docData.data();
    return {
        id: docData.id,
        ...data,
        createdAt: toDate(data.createdAt),
    } as User;
};

// ==================== ARISAN OPERATIONS ====================

const defaultSettings: ArisanSettings = {
    penaltyEnabled: false,
    penaltyType: 'percentage',
    penaltyAmount: 0,
    reminderEnabled: true,
    reminderDays: [-3, -1, 0],
    reminderTime: '09:00',
};

export const createArisan = async (arisanData: Omit<Arisan, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.ARISANS), {
        ...arisanData,
        settings: arisanData.settings || defaultSettings,
        createdAt: serverTimestamp(),
        dueDate: arisanData.dueDate ? Timestamp.fromDate(arisanData.dueDate) : null,
    });
    return docRef.id;
};

export const getArisanById = async (arisanId: string): Promise<Arisan | null> => {
    const docRef = doc(db, COLLECTIONS.ARISANS, arisanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Get members subcollection
        const membersSnap = await getDocs(collection(db, COLLECTIONS.ARISANS, arisanId, 'members'));
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
    }
    return null;
};

export const getArisanByInviteCode = async (inviteCode: string): Promise<Arisan | null> => {
    const q = query(collection(db, COLLECTIONS.ARISANS), where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0];
    return getArisanById(docData.id);
};

export const getArisansByUser = async (userId: string): Promise<Arisan[]> => {
    // Get arisans created by user
    const q = query(collection(db, COLLECTIONS.ARISANS), where('createdBy', '==', userId));
    const snapshot = await getDocs(q);

    const arisans: Arisan[] = [];
    for (const docData of snapshot.docs) {
        const arisan = await getArisanById(docData.id);
        if (arisan) arisans.push(arisan);
    }

    // Also get arisans where user is a member
    const memberQ = query(collection(db, COLLECTIONS.MEMBERS), where('userId', '==', userId));
    const memberSnap = await getDocs(memberQ);

    for (const memberDoc of memberSnap.docs) {
        const arisanId = memberDoc.data().arisanId;
        if (!arisans.find(a => a.id === arisanId)) {
            const arisan = await getArisanById(arisanId);
            if (arisan) arisans.push(arisan);
        }
    }

    return arisans;
};

export const updateArisan = async (arisanId: string, data: Partial<Arisan>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ARISANS, arisanId);
    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) {
        updateData.dueDate = Timestamp.fromDate(data.dueDate);
    }
    delete updateData.id;
    delete updateData.members; // Members are in subcollection
    await updateDoc(docRef, updateData);
};

export const deleteArisan = async (arisanId: string): Promise<void> => {
    // Delete members subcollection first
    const membersSnap = await getDocs(collection(db, COLLECTIONS.ARISANS, arisanId, 'members'));
    for (const memberDoc of membersSnap.docs) {
        await deleteDoc(memberDoc.ref);
    }
    // Delete arisan
    await deleteDoc(doc(db, COLLECTIONS.ARISANS, arisanId));
};

// ==================== MEMBER OPERATIONS ====================

export const addMemberToArisan = async (arisanId: string, memberData: Omit<Member, 'id' | 'joinedAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.ARISANS, arisanId, 'members'), {
        ...memberData,
        arisanId,
        joinedAt: serverTimestamp(),
    });

    // Also add to global members collection for querying
    await addDoc(collection(db, COLLECTIONS.MEMBERS), {
        ...memberData,
        arisanId,
        memberId: docRef.id,
        joinedAt: serverTimestamp(),
    });

    return docRef.id;
};

export const updateMember = async (arisanId: string, memberId: string, data: Partial<Member>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ARISANS, arisanId, 'members', memberId);
    await updateDoc(docRef, data);
};

export const removeMember = async (arisanId: string, memberId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ARISANS, arisanId, 'members', memberId));

    // Also remove from global members collection
    const q = query(collection(db, COLLECTIONS.MEMBERS),
        where('arisanId', '==', arisanId),
        where('memberId', '==', memberId)
    );
    const snapshot = await getDocs(q);
    for (const docData of snapshot.docs) {
        await deleteDoc(docData.ref);
    }
};

// ==================== PAYMENT OPERATIONS ====================

export const createPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
        ...paymentData,
        submittedAt: paymentData.submittedAt ? Timestamp.fromDate(paymentData.submittedAt) : null,
        approvedAt: paymentData.approvedAt ? Timestamp.fromDate(paymentData.approvedAt) : null,
        paidAt: paymentData.paidAt ? Timestamp.fromDate(paymentData.paidAt) : null,
    });
    return docRef.id;
};

export const getPaymentsByRound = async (arisanId: string, round: number): Promise<Payment[]> => {
    const q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('arisanId', '==', arisanId),
        where('round', '==', round)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docData => {
        const data = docData.data();
        return {
            id: docData.id,
            ...data,
            submittedAt: data.submittedAt ? toDate(data.submittedAt) : undefined,
            approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
            paidAt: data.paidAt ? toDate(data.paidAt) : undefined,
        } as Payment;
    });
};

export const updatePayment = async (paymentId: string, data: Partial<Payment>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    const updateData: Record<string, unknown> = { ...data };
    if (data.submittedAt) updateData.submittedAt = Timestamp.fromDate(data.submittedAt);
    if (data.approvedAt) updateData.approvedAt = Timestamp.fromDate(data.approvedAt);
    if (data.paidAt) updateData.paidAt = Timestamp.fromDate(data.paidAt);
    await updateDoc(docRef, updateData);
};

// ==================== ROUND OPERATIONS ====================

export const createRound = async (roundData: Omit<Round, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTIONS.ROUNDS), {
        ...roundData,
        dueDate: Timestamp.fromDate(roundData.dueDate),
        completedAt: roundData.completedAt ? Timestamp.fromDate(roundData.completedAt) : null,
    });
    return docRef.id;
};

export const getRoundsByArisan = async (arisanId: string): Promise<Round[]> => {
    const q = query(
        collection(db, COLLECTIONS.ROUNDS),
        where('arisanId', '==', arisanId),
        orderBy('roundNumber', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docData => {
        const data = docData.data();
        return {
            id: docData.id,
            ...data,
            dueDate: toDate(data.dueDate),
            completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
        } as Round;
    });
};

export const updateRound = async (roundId: string, data: Partial<Round>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ROUNDS, roundId);
    await updateDoc(docRef, data);
};

// ==================== UTILITY ====================

export const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
