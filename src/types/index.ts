// ========================================
// ARISAN ONLINE - TYPE DEFINITIONS
// ========================================

// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    createdAt: Date;
}

// Member Types
export type MemberRole = 'ketua' | 'bendahara' | 'anggota';
export type MemberStatus = 'active' | 'pending' | 'left';

export interface Member {
    id: string;
    userId?: string;
    name: string;
    phone: string;
    role: MemberRole;
    turnOrder: number;
    contributionAmount: number; // Individual monthly contribution
    joinedAt: Date;
    status: MemberStatus;
}

// Arisan Types
export type ArisanPeriod = 'mingguan' | 'bulanan';
export type ArisanStatus = 'aktif' | 'selesai' | 'draft';
export type TurnMethod = 'manual' | 'undian';
export type ArisanMode = 'tetap' | 'menurun'; // Tetap = sama semua, Menurun = giliran awal bayar lebih

export interface Arisan {
    id: string;
    name: string;
    nominal: number;
    period: ArisanPeriod;
    totalMembers: number;
    currentRound: number;
    status: ArisanStatus;
    turnMethod: TurnMethod;
    mode?: ArisanMode; // Default: 'tetap'
    targetAmount?: number; // Target pencairan per bulan (untuk mode menurun)
    selisihPeriod?: 1 | 4 | 6; // Periode perubahan selisih (per berapa bulan)
    selisihPerPeriod?: number[]; // Nilai selisih per periode
    adminFee?: number; // Biaya administrasi per member
    inviteCode: string;
    createdBy: string;
    createdAt: Date;
    dueDate?: Date;
    disbursementDate?: number; // Tanggal pencairan (1-31)
    paymentDeadline?: number; // Batas pembayaran (1-31)
    members: Member[];
    paymentAccounts: PaymentAccount[];
    // Settings
    settings: ArisanSettings;
    drawHistory?: DrawRecord[]; // History of random draws
}


export interface ArisanSettings {
    penaltyEnabled: boolean;
    penaltyType: 'percentage' | 'fixed'; // Percentage per day or fixed amount
    penaltyAmount: number; // Percentage (e.g., 1 = 1%) or fixed rupiah
    reminderEnabled: boolean;
    reminderDays: number[]; // Days before due date [-3, -1, 0]
    reminderTime: string; // "09:00"
}

export interface DrawRecord {
    id: string;
    performedAt: Date;
    performedBy: string;
    result: { memberId: string; memberName: string; turnOrder: number }[];
}

// Payment Account Types (Admin's bank/e-wallet)
export type PaymentAccountType = 'bank' | 'ewallet';

export interface PaymentAccount {
    id: string;
    type: PaymentAccountType;
    bankName: string; // Bank name or e-wallet name (BCA, Mandiri, GoPay, OVO, etc.)
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
}

// Payment Types
export type PaymentStatus = 'pending' | 'submitted' | 'approved' | 'paid' | 'rejected' | 'overdue';

export interface Payment {
    id: string;
    arisanId: string;
    memberId: string;
    round: number;
    amount: number;
    status: PaymentStatus;
    submittedAt?: Date; // When member submitted payment proof
    approvedBy?: string; // Admin who approved
    approvedAt?: Date; // When admin approved
    paidAt?: Date;
    confirmedBy?: string;
    confirmedAt?: Date;
    paymentAccountId?: string; // Which account was used
    note?: string;
}

// Round/Giliran Types
export interface Round {
    id: string;
    arisanId: string;
    roundNumber: number;
    winnerId: string;
    winnerName: string;
    dueDate: Date;
    completedAt?: Date;
    totalCollected: number;
    payments: Payment[];
}

// Notification Types
export type NotificationType = 'reminder' | 'confirmation' | 'winner' | 'info';
export type NotificationStatus = 'sent' | 'failed' | 'delivered' | 'read';

export interface NotificationSetting {
    userId: string;
    whatsappNumber: string;
    reminderDays: number[]; // [-3, -1, 0, 1]
    reminderTime: string; // "09:00"
    isEnabled: boolean;
}

export interface NotificationLog {
    id: string;
    arisanId: string;
    userId: string;
    type: NotificationType;
    message: string;
    sentAt: Date;
    status: NotificationStatus;
}

// Create Arisan Form Types
export interface CreateArisanFormData {
    // Step 1: Info
    name: string;
    nominal: number;
    period: ArisanPeriod;
    totalMembers: number;
    disbursementDate?: number; // Tanggal pencairan (1-31)
    paymentDeadline?: number; // Batas pembayaran (1-31)
    mode?: ArisanMode; // Default: 'tetap'
    targetAmount?: number; // Target pencairan (untuk mode menurun)
    selisihPeriod?: 1 | 4 | 6; // Periode perubahan selisih
    selisihPerPeriod?: number[]; // Nilai selisih per periode
    adminFee?: number; // Biaya administrasi

    // Step 2: Members
    members: Omit<Member, 'id' | 'joinedAt' | 'status'>[];

    // Step 3: Turn Order
    turnMethod: TurnMethod;
    turnOrder: string[]; // member ids

    // Optional: Payment accounts
    paymentAccounts?: PaymentAccount[];
}

// Auth Types
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// UI Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// Tab Types for Detail Page
export type ArisanDetailTab = 'ringkasan' | 'anggota' | 'riwayat';
