import type { Arisan, User, Member, Payment, Round } from '../types';

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'user-1',
        name: 'Budi Santoso',
        email: 'budi@email.com',
        phone: '+6281234567890',
        createdAt: new Date('2024-01-15'),
    },
    {
        id: 'user-2',
        name: 'Ani Wijaya',
        email: 'ani@email.com',
        phone: '+6281234567891',
        createdAt: new Date('2024-02-10'),
    },
];

// Mock Members for Arisan Keluarga
const arisanKeluargaMembers: Member[] = [
    { id: 'm1', userId: 'user-1', name: 'Budi Santoso', phone: '+6281234567890', role: 'ketua', turnOrder: 1, contributionAmount: 500000, joinedAt: new Date('2024-06-01'), status: 'active' },
    { id: 'm2', name: 'Ani Wijaya', phone: '+6281234567891', role: 'bendahara', turnOrder: 2, contributionAmount: 500000, joinedAt: new Date('2024-06-01'), status: 'active' },
    { id: 'm3', name: 'Cici Permata', phone: '+6281234567892', role: 'anggota', turnOrder: 3, contributionAmount: 500000, joinedAt: new Date('2024-06-02'), status: 'active' },
    { id: 'm4', name: 'Dedi Kurniawan', phone: '+6281234567893', role: 'anggota', turnOrder: 4, contributionAmount: 500000, joinedAt: new Date('2024-06-02'), status: 'active' },
    { id: 'm5', name: 'Eka Putri', phone: '+6281234567894', role: 'anggota', turnOrder: 5, contributionAmount: 500000, joinedAt: new Date('2024-06-03'), status: 'active' },
    { id: 'm6', name: 'Fajar Rahman', phone: '+6281234567895', role: 'anggota', turnOrder: 6, contributionAmount: 500000, joinedAt: new Date('2024-06-03'), status: 'active' },
    { id: 'm7', name: 'Gita Sari', phone: '+6281234567896', role: 'anggota', turnOrder: 7, contributionAmount: 500000, joinedAt: new Date('2024-06-04'), status: 'active' },
    { id: 'm8', name: 'Hadi Pratama', phone: '+6281234567897', role: 'anggota', turnOrder: 8, contributionAmount: 500000, joinedAt: new Date('2024-06-04'), status: 'active' },
    { id: 'm9', name: 'Indah Lestari', phone: '+6281234567898', role: 'anggota', turnOrder: 9, contributionAmount: 500000, joinedAt: new Date('2024-06-05'), status: 'active' },
    { id: 'm10', name: 'Joko Widodo', phone: '+6281234567899', role: 'anggota', turnOrder: 10, contributionAmount: 500000, joinedAt: new Date('2024-06-05'), status: 'active' },
];

// Mock Members for Arisan Kantor
const arisanKantorMembers: Member[] = [
    { id: 'k1', userId: 'user-1', name: 'Budi Santoso', phone: '+6281234567890', role: 'anggota', turnOrder: 3, contributionAmount: 200000, joinedAt: new Date('2024-08-01'), status: 'active' },
    { id: 'k2', name: 'Lisa Marketing', phone: '+6281111111111', role: 'ketua', turnOrder: 1, contributionAmount: 200000, joinedAt: new Date('2024-08-01'), status: 'active' },
    { id: 'k3', name: 'Rudi Finance', phone: '+6281111111112', role: 'bendahara', turnOrder: 2, contributionAmount: 200000, joinedAt: new Date('2024-08-01'), status: 'active' },
    { id: 'k4', name: 'Maya HR', phone: '+6281111111113', role: 'anggota', turnOrder: 4, contributionAmount: 200000, joinedAt: new Date('2024-08-02'), status: 'active' },
    { id: 'k5', name: 'Agus IT', phone: '+6281111111114', role: 'anggota', turnOrder: 5, contributionAmount: 200000, joinedAt: new Date('2024-08-02'), status: 'active' },
];

// Default settings for arisans
const defaultSettings = {
    penaltyEnabled: false,
    penaltyType: 'percentage' as const,
    penaltyAmount: 1,
    reminderEnabled: true,
    reminderDays: [-3, -1, 0],
    reminderTime: '09:00',
};

// Mock Arisans
export const mockArisans: Arisan[] = [
    {
        id: 'arisan-1',
        name: 'Arisan Keluarga Besar',
        nominal: 500000,
        period: 'bulanan',
        totalMembers: 10,
        currentRound: 3,
        status: 'aktif',
        turnMethod: 'undian',
        inviteCode: 'KEL2024',
        createdBy: 'user-1',
        createdAt: new Date('2024-06-01'),
        dueDate: new Date('2024-12-25'),
        members: arisanKeluargaMembers,
        paymentAccounts: [
            { id: 'acc-1', type: 'bank', bankName: 'BCA', accountNumber: '1234567890', accountHolder: 'Budi Santoso', isActive: true },
            { id: 'acc-2', type: 'ewallet', bankName: 'GoPay', accountNumber: '081234567890', accountHolder: 'Budi S', isActive: true },
        ],
        settings: { ...defaultSettings, penaltyEnabled: true },
    },
    {
        id: 'arisan-2',
        name: 'Arisan Kantor Divisi Marketing',
        nominal: 200000,
        period: 'mingguan',
        totalMembers: 5,
        currentRound: 7,
        status: 'aktif',
        turnMethod: 'manual',
        inviteCode: 'MKT2024',
        createdBy: 'k2',
        createdAt: new Date('2024-08-01'),
        dueDate: new Date('2024-12-20'),
        members: arisanKantorMembers,
        paymentAccounts: [
            { id: 'acc-3', type: 'bank', bankName: 'Mandiri', accountNumber: '0987654321', accountHolder: 'Lisa Marketing', isActive: true },
        ],
        settings: { ...defaultSettings },
    },
    {
        id: 'arisan-3',
        name: 'Arisan RT 05',
        nominal: 100000,
        period: 'bulanan',
        totalMembers: 15,
        currentRound: 12,
        status: 'selesai',
        turnMethod: 'undian',
        inviteCode: 'RT052023',
        createdBy: 'user-1',
        createdAt: new Date('2023-01-01'),
        members: [],
        paymentAccounts: [],
        settings: { ...defaultSettings },
    },
];

// Mock Payments for current round
export const mockPayments: Payment[] = [
    // Arisan Keluarga Round 3
    { id: 'pay-1', arisanId: 'arisan-1', memberId: 'm1', round: 3, amount: 500000, status: 'paid', paidAt: new Date('2024-12-10'), confirmedBy: 'm2' },
    { id: 'pay-2', arisanId: 'arisan-1', memberId: 'm2', round: 3, amount: 500000, status: 'paid', paidAt: new Date('2024-12-11'), confirmedBy: 'm1' },
    { id: 'pay-3', arisanId: 'arisan-1', memberId: 'm3', round: 3, amount: 500000, status: 'pending' },
    { id: 'pay-4', arisanId: 'arisan-1', memberId: 'm4', round: 3, amount: 500000, status: 'pending' },
    { id: 'pay-5', arisanId: 'arisan-1', memberId: 'm5', round: 3, amount: 500000, status: 'paid', paidAt: new Date('2024-12-12') },
    { id: 'pay-6', arisanId: 'arisan-1', memberId: 'm6', round: 3, amount: 500000, status: 'overdue' },
    { id: 'pay-7', arisanId: 'arisan-1', memberId: 'm7', round: 3, amount: 500000, status: 'paid', paidAt: new Date('2024-12-13') },
    { id: 'pay-8', arisanId: 'arisan-1', memberId: 'm8', round: 3, amount: 500000, status: 'pending' },
    { id: 'pay-9', arisanId: 'arisan-1', memberId: 'm9', round: 3, amount: 500000, status: 'paid', paidAt: new Date('2024-12-14') },
    { id: 'pay-10', arisanId: 'arisan-1', memberId: 'm10', round: 3, amount: 500000, status: 'pending' },
];

// Mock Rounds (History)
export const mockRounds: Round[] = [
    {
        id: 'round-1',
        arisanId: 'arisan-1',
        roundNumber: 1,
        winnerId: 'm1',
        winnerName: 'Budi Santoso',
        dueDate: new Date('2024-10-25'),
        completedAt: new Date('2024-10-25'),
        totalCollected: 5000000,
        payments: [],
    },
    {
        id: 'round-2',
        arisanId: 'arisan-1',
        roundNumber: 2,
        winnerId: 'm2',
        winnerName: 'Ani Wijaya',
        dueDate: new Date('2024-11-25'),
        completedAt: new Date('2024-11-25'),
        totalCollected: 5000000,
        payments: [],
    },
    {
        id: 'round-3',
        arisanId: 'arisan-1',
        roundNumber: 3,
        winnerId: 'm3',
        winnerName: 'Cici Permata',
        dueDate: new Date('2024-12-25'),
        totalCollected: 2500000, // 5 paid so far
        payments: [],
    },
];

// Helper to get user's arisan list
export const getUserArisans = (userId: string): Arisan[] => {
    return mockArisans.filter(arisan =>
        arisan.createdBy === userId ||
        arisan.members.some(m => m.userId === userId)
    );
};

// Helper to get arisan by ID
export const getArisanById = (id: string): Arisan | undefined => {
    return mockArisans.find(arisan => arisan.id === id);
};

// Helper to get arisan by invite code
export const getArisanByInviteCode = (code: string): Arisan | undefined => {
    return mockArisans.find(arisan => arisan.inviteCode === code);
};

// Helper to get member payment status
export const getMemberPaymentStatus = (arisanId: string, memberId: string, round: number): Payment | undefined => {
    return mockPayments.find(p =>
        p.arisanId === arisanId &&
        p.memberId === memberId &&
        p.round === round
    );
};

// Helper to get rounds for an arisan
export const getArisanRounds = (arisanId: string): Round[] => {
    return mockRounds.filter(r => r.arisanId === arisanId);
};

// Helper to format currency
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper to format date
export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

// Helper to format short date
export const formatShortDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

// Generate random invite code
export const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Generate unique ID
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
