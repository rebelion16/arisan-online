import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Settings, Wallet, Calendar,
    Clock, CheckCircle, AlertCircle, Crown,
    Share2, Copy, Phone, Plus, Trash2, Check,
    ChevronUp, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArisan } from '../context/ArisanContext';
import { useToast } from '../context/ToastContext';
import SettingsModal from '../components/SettingsModal';
import type { ArisanDetailTab, Payment, PaymentAccountType } from '../types';
import { formatCurrency, formatDate, formatShortDate } from '../data/mockData';

const ArisanDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getArisanById, getPaymentsByRound, getRoundHistory, submitPayment, approvePayment, addPaymentAccount, removePaymentAccount, updateMemberOrder, deleteArisan, updateArisan, updateSettings, removeMember, updateMemberRole, randomDrawOrder, startNewRound } = useArisan();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ArisanDetailTab>('ringkasan');
    const [copied, setCopied] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [newAccount, setNewAccount] = useState({ type: 'bank' as PaymentAccountType, bankName: '', accountNumber: '', accountHolder: '' });

    const arisan = id ? getArisanById(id) : undefined;
    const payments = arisan ? getPaymentsByRound(arisan.id, arisan.currentRound) : [];
    const rounds = arisan ? getRoundHistory(arisan.id) : [];

    // Client-side overdue check - compares current date with due date
    const isPaymentOverdue = useMemo(() => {
        if (!arisan?.dueDate) return false;
        const now = new Date();
        // Handle both Date and Firestore Timestamp
        const dueDate = arisan.dueDate instanceof Date
            ? arisan.dueDate
            : (arisan.dueDate as { toDate: () => Date }).toDate();
        return now > dueDate;
    }, [arisan?.dueDate]);

    // Helper to check if a specific payment should show as overdue
    const checkOverdueStatus = (payment: Payment): boolean => {
        if (payment.status !== 'pending') return false;
        return isPaymentOverdue;
    };

    useEffect(() => {
        if (!arisan) {
            navigate('/dashboard');
        }
    }, [arisan, navigate]);

    if (!arisan) return null;

    const currentMember = arisan.members.find(m => m.userId === user?.id);
    // Match payment by id OR name (legacy data uses name as memberId)
    const currentPayment = payments.find(p =>
        p.memberId === currentMember?.id || p.memberId === currentMember?.name
    );
    const isAdmin = arisan.createdBy === user?.id;
    const currentWinner = arisan.members.find(m => m.turnOrder === arisan.currentRound);

    const paidCount = payments.filter(p => p.status === 'paid' || p.status === 'approved').length;
    const submittedCount = payments.filter(p => p.status === 'submitted').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    // Count overdue: either status is 'overdue' OR pending but past due date (client-side check)
    const overdueCount = payments.filter(p => p.status === 'overdue' || checkOverdueStatus(p)).length;

    const handleCopyLink = () => {
        const link = `${window.location.origin}/join/${arisan.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const link = `${window.location.origin}/join/${arisan.inviteCode}`;
        const text = `Hai! Yuk gabung arisan *${arisan.name}*!\n\n💰 Nominal: ${formatCurrency(arisan.nominal)}\n📅 Periode: ${arisan.period === 'mingguan' ? 'Mingguan' : 'Bulanan'}\n👥 Anggota: ${arisan.members.length}/${arisan.totalMembers}\n\nKlik untuk gabung:\n${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleConfirmPayment = async () => {
        if (!currentMember) return;
        await submitPayment(arisan.id, currentMember.id, arisan.currentRound);
    };

    const handleApprovePayment = async (memberId: string) => {
        await approvePayment(arisan.id, memberId, arisan.currentRound);
    };

    const handleAddAccount = () => {
        if (newAccount.bankName && newAccount.accountNumber && newAccount.accountHolder) {
            addPaymentAccount(arisan.id, { ...newAccount, isActive: true });
            setNewAccount({ type: 'bank', bankName: '', accountNumber: '', accountHolder: '' });
            setShowAddAccount(false);
        }
    };

    const getPaymentStatusBadge = (payment: Payment) => {
        switch (payment.status) {
            case 'paid':
            case 'approved':
                return <span className="badge badge-success"><CheckCircle size={12} /> Lunas</span>;
            case 'submitted':
                return <span className="badge badge-info" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}><Clock size={12} /> Menunggu</span>;
            case 'pending':
                // Client-side check: show as overdue if past due date
                if (checkOverdueStatus(payment)) {
                    return <span className="badge badge-error"><AlertCircle size={12} /> Telat</span>;
                }
                return <span className="badge badge-warning"><Clock size={12} /> Belum</span>;
            case 'overdue':
                return <span className="badge badge-error"><AlertCircle size={12} /> Telat</span>;
            default:
                return <span className="badge badge-secondary"><Clock size={12} /> {payment.status}</span>;
        }
    };

    const tabs: { key: ArisanDetailTab; label: string }[] = [
        { key: 'ringkasan', label: 'Ringkasan' },
        { key: 'anggota', label: 'Anggota' },
        { key: 'riwayat', label: 'Riwayat' },
    ];

    return (
        <div className="page">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-semibold" style={{ flex: 1, textAlign: 'center' }}>
                        {arisan.name}
                    </h1>
                    {isAdmin && (
                        <div className="flex gap-xs">
                            <button
                                onClick={() => {
                                    if (window.confirm('Hapus arisan ini? Semua data akan hilang.')) {
                                        deleteArisan(arisan.id);
                                        showToast('Arisan berhasil dihapus', 'warning');
                                        navigate('/dashboard');
                                    }
                                }}
                                className="btn btn-ghost btn-icon text-error"
                                title="Hapus Arisan"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button onClick={() => setShowSettings(true)} className="btn btn-ghost btn-icon" title="Settings">
                                <Settings size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="tabs" style={{ padding: '0 var(--space-md)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="container py-lg">
                {/* Tab: Ringkasan */}
                {activeTab === 'ringkasan' && (
                    <div className="animate-fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-md mb-lg">
                            <div className="card stat-card">
                                <div className="stat-value">
                                    {formatCurrency(arisan.mode === 'menurun' && arisan.targetAmount ? arisan.targetAmount : arisan.nominal)}
                                </div>
                                <div className="stat-label">
                                    {arisan.mode === 'menurun' ? 'Target/Bulan' : 'Nominal'}
                                </div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-value">{arisan.period === 'mingguan' ? 'Minggu' : 'Bulan'}</div>
                                <div className="stat-label">Periode</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-value">{arisan.members.length}/{arisan.totalMembers}</div>
                                <div className="stat-label">Anggota</div>
                            </div>
                        </div>

                        {/* Schedule Info */}
                        {arisan.period === 'bulanan' && (arisan.disbursementDate || arisan.paymentDeadline) && (
                            <div className="card card-body mb-lg" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="grid grid-cols-2 gap-md text-center">
                                    <div>
                                        <div className="text-2xl mb-xs">📅</div>
                                        <div className="font-semibold">Tanggal {arisan.disbursementDate || 1}</div>
                                        <div className="text-sm text-muted">Pencairan</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl mb-xs">⏰</div>
                                        <div className="font-semibold">Tanggal {arisan.paymentDeadline || 25}</div>
                                        <div className="text-sm text-muted">Batas Bayar</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current Round Info */}
                        <div className="card card-body mb-lg">
                            <h3 className="font-semibold mb-md flex items-center gap-sm">
                                <Calendar size={18} />
                                Pencairan Arisan ke-{arisan.currentRound}
                            </h3>

                            {currentWinner && (
                                <div className="list-item" style={{ background: 'var(--primary-bg)', border: 'none' }}>
                                    <div className="avatar">
                                        <Crown size={20} />
                                    </div>
                                    <div className="list-item-content">
                                        <div className="list-item-title">Giliran: {currentWinner.name}</div>
                                        <div className="list-item-subtitle flex flex-col gap-xs">
                                            {arisan.disbursementDate && (
                                                <span>📅 Pencairan: Tanggal {arisan.disbursementDate} setiap {arisan.period === 'mingguan' ? 'minggu' : 'bulan'}</span>
                                            )}
                                            {arisan.dueDate && (
                                                <span>⏰ Batas bayar: {formatShortDate(arisan.dueDate)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-md mt-md">
                                <div className="flex items-center gap-xs text-success">
                                    <CheckCircle size={16} />
                                    <span className="text-sm">{paidCount} lunas</span>
                                </div>
                                {submittedCount > 0 && (
                                    <div className="flex items-center gap-xs" style={{ color: '#3b82f6' }}>
                                        <Clock size={16} />
                                        <span className="text-sm">{submittedCount} menunggu</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-xs text-warning">
                                    <Clock size={16} />
                                    <span className="text-sm">{pendingCount} belum</span>
                                </div>
                                {overdueCount > 0 && (
                                    <div className="flex items-center gap-xs text-error">
                                        <AlertCircle size={16} />
                                        <span className="text-sm">{overdueCount} telat</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Status */}
                        {currentMember && (
                            <div className="card card-body mb-lg">
                                <h3 className="font-semibold mb-md">Status Kamu</h3>

                                <div className="flex flex-col gap-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-secondary">Giliran</span>
                                        <span className="font-semibold">ke-{currentMember.turnOrder}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-secondary">Setoran</span>
                                        <span className="font-semibold">{formatCurrency(currentMember.contributionAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-secondary">Status Bayar</span>
                                        {currentPayment ? (
                                            getPaymentStatusBadge(currentPayment)
                                        ) : (
                                            <span className="badge badge-warning"><Clock size={12} /> Belum</span>
                                        )}
                                    </div>
                                </div>

                                {/* Rekening Admin untuk Transfer - show when pending or no payment yet */}
                                {arisan.paymentAccounts.length > 0 && (!currentPayment || currentPayment.status === 'pending') && (
                                    <div className="mt-md p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 className="text-sm font-semibold mb-sm">📋 Rekening Pembayaran</h4>
                                        <div className="flex flex-col gap-sm">
                                            {arisan.paymentAccounts.filter(acc => acc.isActive).map(acc => (
                                                <div key={acc.id} className="flex justify-between items-center text-sm p-sm" style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-xs font-semibold">
                                                            <span>{acc.type === 'bank' ? '🏦' : '📱'}</span>
                                                            <span>{acc.bankName}</span>
                                                        </div>
                                                        <div className="text-base font-bold" style={{ fontFamily: 'monospace' }}>{acc.accountNumber}</div>
                                                        <div className="text-xs text-muted">a.n. {acc.accountHolder}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(acc.accountNumber);
                                                            showToast('Nomor rekening disalin! 📋', 'success');
                                                        }}
                                                        className="btn btn-sm btn-secondary"
                                                        style={{ padding: '8px 12px' }}
                                                        title="Salin Rekening"
                                                    >
                                                        <Copy size={14} />
                                                        Salin
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show button when pending or no payment record exists */}
                                {(!currentPayment || currentPayment.status === 'pending') && (
                                    <button
                                        onClick={handleConfirmPayment}
                                        className="btn btn-primary w-full mt-lg"
                                    >
                                        <Wallet size={18} />
                                        Kirim Konfirmasi Setoran
                                    </button>
                                )}

                                {currentPayment?.status === 'submitted' && (
                                    <div className="mt-md p-sm text-center" style={{ background: 'rgba(234, 179, 8, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                        <span className="text-warning text-sm">⏳ Menunggu konfirmasi admin</span>
                                    </div>
                                )}

                                {(currentPayment?.status === 'approved' || currentPayment?.status === 'paid') && (
                                    <div className="mt-md p-sm text-center" style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                        <span className="text-success text-sm">✅ Pembayaran sudah lunas</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Invite Section */}
                        {arisan.members.length < arisan.totalMembers && (
                            <div className="card card-body mb-lg">
                                <h3 className="font-semibold mb-md">Undang Anggota</h3>
                                <p className="text-sm text-secondary mb-md">
                                    Masih butuh {arisan.totalMembers - arisan.members.length} anggota lagi
                                </p>

                                <div className="flex gap-sm mb-md">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={`${window.location.origin}/join/${arisan.inviteCode}`}
                                        readOnly
                                        style={{ fontSize: 'var(--font-size-sm)' }}
                                    />
                                    <button onClick={handleCopyLink} className="btn btn-secondary btn-icon">
                                        <Copy size={18} />
                                    </button>
                                </div>

                                {copied && (
                                    <p className="text-sm text-success mb-md">✓ Link disalin!</p>
                                )}

                                <button onClick={handleShareWhatsApp} className="btn btn-primary w-full">
                                    <Share2 size={18} />
                                    Share ke WhatsApp
                                </button>
                            </div>
                        )}

                        {/* Admin Panel: Payment Accounts */}
                        {isAdmin && (
                            <div className="card card-body mb-lg">
                                <div className="flex justify-between items-center mb-md">
                                    <h3 className="font-semibold">💳 Rekening Pembayaran</h3>
                                    <button
                                        onClick={() => setShowAddAccount(!showAddAccount)}
                                        className="btn btn-sm btn-outline"
                                    >
                                        <Plus size={16} />
                                        Tambah
                                    </button>
                                </div>

                                {showAddAccount && (
                                    <div className="p-sm mb-md" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <div className="flex flex-col gap-sm">
                                            <div className="flex gap-sm">
                                                <button
                                                    onClick={() => setNewAccount({ ...newAccount, type: 'bank' })}
                                                    className={`btn btn-sm ${newAccount.type === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
                                                >
                                                    🏦 Bank
                                                </button>
                                                <button
                                                    onClick={() => setNewAccount({ ...newAccount, type: 'ewallet' })}
                                                    className={`btn btn-sm ${newAccount.type === 'ewallet' ? 'btn-primary' : 'btn-secondary'}`}
                                                >
                                                    📱 E-Wallet
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder={newAccount.type === 'bank' ? 'Nama Bank (BCA, Mandiri)' : 'Nama E-Wallet (GoPay, OVO)'}
                                                value={newAccount.bankName}
                                                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Nomor Rekening / HP"
                                                value={newAccount.accountNumber}
                                                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Nama Pemilik"
                                                value={newAccount.accountHolder}
                                                onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                                            />
                                            <button onClick={handleAddAccount} className="btn btn-primary btn-sm">
                                                Simpan
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {arisan.paymentAccounts.length === 0 ? (
                                    <p className="text-sm text-muted text-center">Belum ada rekening</p>
                                ) : (
                                    <div className="flex flex-col gap-sm">
                                        {arisan.paymentAccounts.map(acc => (
                                            <div key={acc.id} className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                                <div>
                                                    <div className="flex items-center gap-xs">
                                                        <span className="badge badge-secondary">{acc.type === 'bank' ? '🏦' : '📱'} {acc.bankName}</span>
                                                    </div>
                                                    <div className="text-sm font-semibold mt-xs">{acc.accountNumber}</div>
                                                    <div className="text-xs text-muted">a.n. {acc.accountHolder}</div>
                                                </div>
                                                <button
                                                    onClick={() => removePaymentAccount(arisan.id, acc.id)}
                                                    className="btn btn-ghost btn-icon btn-sm text-error"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Admin Panel: Pending Approvals */}
                        {isAdmin && payments.filter(p => p.status === 'submitted').length > 0 && (
                            <div className="card card-body">
                                <h3 className="font-semibold mb-md">⏳ Menunggu Konfirmasi</h3>
                                <div className="flex flex-col gap-sm">
                                    {payments.filter(p => p.status === 'submitted').map(payment => {
                                        const member = arisan.members.find(m => m.id === payment.memberId);
                                        return (
                                            <div key={payment.id} className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                                <div>
                                                    <div className="font-semibold">{member?.name}</div>
                                                    <div className="text-sm text-muted">{formatCurrency(payment.amount)}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleApprovePayment(payment.memberId)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <Check size={16} />
                                                    Setujui
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Anggota */}
                {activeTab === 'anggota' && (
                    <div className="animate-fade-in">
                        {arisan.members.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">👥</div>
                                <p className="empty-state-title">Belum Ada Anggota</p>
                                <p className="empty-state-desc">Bagikan link undangan untuk menambah anggota</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-sm">
                                {arisan.members
                                    .sort((a, b) => a.turnOrder - b.turnOrder)
                                    .map(member => {
                                        // Match payment by id OR name (legacy data uses name as memberId)
                                        const payment = payments.find(p =>
                                            p.memberId === member.id || p.memberId === member.name
                                        );
                                        const isCurrentUser = member.userId === user?.id;

                                        return (
                                            <div
                                                key={member.id}
                                                className="card list-item"
                                                style={isCurrentUser ? { borderColor: 'var(--primary)' } : undefined}
                                            >
                                                <div className="avatar">
                                                    {member.turnOrder}
                                                </div>
                                                <div className="list-item-content">
                                                    <div className="list-item-title flex items-center gap-sm">
                                                        {member.name}
                                                        {isCurrentUser && <span className="text-xs text-muted">(Kamu)</span>}
                                                        {member.role === 'ketua' && <Crown size={14} className="text-warning" />}
                                                    </div>
                                                    <div className="list-item-subtitle flex items-center gap-sm">
                                                        <span className="badge badge-secondary">{member.role}</span>
                                                        <span className="text-xs">{formatCurrency(member.contributionAmount)}</span>
                                                        {member.phone && (
                                                            <a href={`tel:${member.phone}`} className="flex items-center gap-xs">
                                                                <Phone size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-xs">
                                                    {payment && getPaymentStatusBadge(payment)}
                                                    {/* Admin: Confirm payment button for submitted status */}
                                                    {isAdmin && payment?.status === 'submitted' && (
                                                        <button
                                                            onClick={() => handleApprovePayment(payment.memberId)}
                                                            className="btn btn-sm btn-primary"
                                                            style={{ padding: '4px 8px' }}
                                                            title="Konfirmasi Setoran"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    {/* Admin: Reorder buttons */}
                                                    {isAdmin && (
                                                        <div className="flex flex-col">
                                                            <button
                                                                onClick={() => updateMemberOrder(arisan.id, member.id, 'up')}
                                                                className="btn btn-ghost btn-sm"
                                                                style={{ padding: '2px' }}
                                                                disabled={member.turnOrder === 1}
                                                            >
                                                                <ChevronUp size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => updateMemberOrder(arisan.id, member.id, 'down')}
                                                                className="btn btn-ghost btn-sm"
                                                                style={{ padding: '2px' }}
                                                                disabled={member.turnOrder === arisan.members.length}
                                                            >
                                                                <ChevronDown size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Riwayat */}
                {activeTab === 'riwayat' && (
                    <div className="animate-fade-in">
                        {rounds.length > 0 ? (
                            <div className="flex flex-col gap-md">
                                {rounds.map(round => {
                                    // Calculate total collected from payments for this round
                                    const roundPayments = payments.filter(p =>
                                        p.arisanId === arisan.id &&
                                        p.round === round.roundNumber &&
                                        (p.status === 'approved' || p.status === 'paid')
                                    );
                                    // Subtract adminFee from each payment to get base contribution (setoran pokok)
                                    const adminFee = arisan.adminFee || 0;
                                    const totalCollected = roundPayments.reduce((sum, p) => sum + (p.amount - adminFee), 0);
                                    // For menurun mode, use targetAmount (target pencairan per bulan)
                                    // For tetap mode, use nominal × totalMembers
                                    const targetAmount = arisan.mode === 'menurun' && arisan.targetAmount
                                        ? arisan.targetAmount
                                        : arisan.nominal * arisan.totalMembers;

                                    return (
                                        <div key={round.id} className="card card-body">
                                            <div className="flex justify-between items-start mb-sm">
                                                <div>
                                                    <h4 className="font-semibold">Pencairan Arisan ke-{round.roundNumber}</h4>
                                                    <div className="flex flex-col gap-xs">
                                                        {arisan.disbursementDate && (
                                                            <p className="text-sm text-muted">
                                                                📅 Pencairan: Tanggal {arisan.disbursementDate}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-muted">
                                                            ⏰ Batas bayar: {formatDate(round.dueDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {round.completedAt ? (
                                                    <span className="badge badge-success">Selesai</span>
                                                ) : (
                                                    <span className="badge badge-warning">Berjalan</span>
                                                )}
                                            </div>

                                            <div className="list-item" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                                                <div className="avatar avatar-sm">
                                                    <Crown size={14} />
                                                </div>
                                                <div className="list-item-content">
                                                    <div className="text-sm font-medium">🎉 Penerima: {round.winnerName}</div>
                                                    <div className="text-xs text-muted flex flex-col gap-xs">
                                                        <div className="flex gap-xs items-center">
                                                            <span>💰 Terkumpul:</span>
                                                            <span className={totalCollected >= targetAmount ? 'text-success font-semibold' : 'text-warning font-semibold'}>
                                                                {formatCurrency(totalCollected)}
                                                            </span>
                                                            <span className="text-muted">({roundPayments.length}/{arisan.totalMembers} lunas)</span>
                                                        </div>
                                                        <span>🎯 Target: {formatCurrency(targetAmount)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <Calendar />
                                </div>
                                <p className="empty-state-title">Belum Ada Riwayat</p>
                                <p className="empty-state-desc">Riwayat putaran akan muncul di sini</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Settings Modal */}
            {arisan && (
                <SettingsModal
                    arisan={arisan}
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onUpdateSettings={(settings) => updateSettings(arisan.id, settings)}
                    onUpdateArisan={(data) => updateArisan(arisan.id, data)}
                    onRemoveMember={(memberId) => removeMember(arisan.id, memberId)}
                    onUpdateMemberRole={(memberId, role) => updateMemberRole(arisan.id, memberId, role)}
                    onRandomDraw={() => randomDrawOrder(arisan.id)}
                    onStartNewRound={() => startNewRound(arisan.id)}
                />
            )}
        </div>
    );
};

export default ArisanDetail;
