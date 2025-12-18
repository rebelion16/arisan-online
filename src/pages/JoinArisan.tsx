import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    Wallet, Users, Calendar, ArrowLeft,
    UserPlus, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArisan } from '../context/ArisanContext';
import { formatCurrency } from '../data/mockData';
import type { Arisan } from '../types';

const JoinArisan: React.FC = () => {
    const navigate = useNavigate();
    const { code } = useParams<{ code: string }>();
    const { isAuthenticated } = useAuth();
    const { getArisanByInviteCode, joinArisan } = useArisan();

    const [inviteCode, setInviteCode] = useState(code || '');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [contributionAmount, setContributionAmount] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [arisan, setArisan] = useState<Arisan | null>(null);
    const [selectedTurn, setSelectedTurn] = useState<number>(0);

    // Calculate available turns (not yet taken)
    const availableTurns = useMemo(() => {
        if (!arisan) return [];
        const takenTurns = arisan.members.map(m => m.turnOrder).filter(o => o > 0);
        const allTurns = Array.from({ length: arisan.totalMembers }, (_, i) => i + 1);
        return allTurns.filter(turn => !takenTurns.includes(turn));
    }, [arisan]);

    // Calculate contribution for menurun mode based on turn (using saved selisih config)
    const calculateContributionForTurn = useMemo(() => {
        if (!arisan || arisan.mode !== 'menurun' || !arisan.targetAmount) {
            return (_turn: number) => arisan?.nominal || 0;
        }

        const n = arisan.totalMembers;
        const target = arisan.targetAmount;
        const selisihPeriodVal = arisan.selisihPeriod || 1;
        const selisihPerPeriodArr = arisan.selisihPerPeriod || [50000];
        const admin = arisan.adminFee || 0;

        // Get selisih for the gap based on which period it belongs to
        const getSelisihForGap = (gapIndex: number): number => {
            if (selisihPeriodVal === 1) {
                return selisihPerPeriodArr[0] || 0;
            } else {
                const periodIndex = Math.floor(gapIndex / selisihPeriodVal);
                return selisihPerPeriodArr[periodIndex] || 0;
            }
        };

        // Calculate total selisih sum for base contribution
        let totalSelisihSum = 0;
        for (let gap = 1; gap < n; gap++) {
            totalSelisihSum += getSelisihForGap(gap) * (n - gap);
        }
        const baseContribution = Math.round((target + totalSelisihSum) / n);

        return (turn: number) => {
            let cumulativeReduction = 0;
            for (let i = 1; i < turn; i++) {
                cumulativeReduction += getSelisihForGap(i);
            }
            return Math.max(0, baseContribution - cumulativeReduction + admin);
        };
    }, [arisan]);

    // Auto-fill contribution when turn is selected
    useEffect(() => {
        if (selectedTurn > 0 && arisan) {
            if (arisan.mode === 'menurun') {
                const amount = calculateContributionForTurn(selectedTurn);
                setContributionAmount(amount.toString());
            } else {
                setContributionAmount(arisan.nominal.toString());
            }
        }
    }, [selectedTurn, arisan, calculateContributionForTurn]);

    // Auto-search when code is provided via URL
    useEffect(() => {
        if (code) {
            setInviteCode(code);
            searchArisan(code);
        }
    }, [code]);

    const searchArisan = async (codeToSearch: string) => {
        if (!codeToSearch.trim() || codeToSearch.length < 4) return;

        setIsSearching(true);
        setError('');
        try {
            const foundArisan = await getArisanByInviteCode(codeToSearch);
            if (foundArisan) {
                setArisan(foundArisan);
            } else {
                setError('Arisan tidak ditemukan. Periksa kode undangan.');
                setArisan(null);
            }
        } catch (err) {
            console.error('Error searching arisan:', err);
            setError('Terjadi kesalahan saat mencari arisan.');
            setArisan(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = () => {
        setError('');
        if (!inviteCode.trim()) {
            setError('Masukkan kode undangan');
            return;
        }
        searchArisan(inviteCode);
    };

    const handleJoin = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { redirect: `/join/${inviteCode}` } });
            return;
        }

        if (!arisan) return;

        // Validate required fields
        if (!fullName.trim()) {
            setError('Nama lengkap wajib diisi');
            return;
        }
        if (!phoneNumber.trim()) {
            setError('Nomor HP wajib diisi');
            return;
        }

        setIsJoining(true);
        try {
            const amount = parseInt(contributionAmount) || arisan.nominal;
            const success = await joinArisan(inviteCode, amount, fullName.trim(), phoneNumber.trim());
            if (success) {
                navigate(`/arisan/${arisan.id}`);
            } else {
                setError('Gagal bergabung. Arisan mungkin sudah penuh.');
            }
        } catch (err) {
            setError('Terjadi kesalahan. Coba lagi.');
        } finally {
            setIsJoining(false);
        }
    };

    const isFull = arisan && arisan.members.length >= arisan.totalMembers;

    return (
        <div className="page flex items-center justify-center" style={{ minHeight: '100vh', padding: 'var(--space-md)' }}>
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-xl">
                    <Link to="/" className="logo justify-center">
                        <div className="logo-icon">
                            <Wallet size={24} />
                        </div>
                        <span className="text-2xl">Arisan Online</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="card">
                    <div className="card-body">
                        {!arisan ? (
                            <>
                                <div className="text-center mb-lg">
                                    <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                        <UserPlus size={28} />
                                    </div>
                                    <h1 className="text-xl font-bold">Join Arisan</h1>
                                    <p className="text-sm text-muted mt-sm">
                                        Masukkan kode undangan dari pengelola arisan
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Kode Undangan</label>
                                    <input
                                        type="text"
                                        className={`form-input text-center text-xl font-bold ${error ? 'form-input-error' : ''}`}
                                        placeholder="ABCD12"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        style={{ letterSpacing: '0.2em' }}
                                        maxLength={10}
                                    />
                                    {error && <p className="form-helper form-error">{error}</p>}
                                </div>

                                <button
                                    onClick={handleSearch}
                                    className="btn btn-primary w-full"
                                    disabled={isSearching || !inviteCode.trim()}
                                >
                                    {isSearching ? (
                                        <>
                                            <Loader2 size={20} className="animate-pulse" />
                                            Mencari...
                                        </>
                                    ) : (
                                        'Cari Arisan'
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-lg">
                                    <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)', background: 'var(--success)' }}>
                                        🎉
                                    </div>
                                    <h1 className="text-xl font-bold">Kamu Diundang!</h1>
                                    <p className="text-sm text-muted mt-sm">
                                        Gabung arisan berikut
                                    </p>
                                </div>

                                <div className="card card-body mb-lg" style={{ background: 'var(--bg-secondary)' }}>
                                    <h2 className="text-lg font-bold mb-md text-center">{arisan.name}</h2>

                                    <div className="flex flex-col gap-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-sm text-secondary">
                                                <Wallet size={16} />
                                                Nominal
                                            </span>
                                            <span className="font-semibold">{formatCurrency(arisan.nominal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-sm text-secondary">
                                                <Calendar size={16} />
                                                Periode
                                            </span>
                                            <span className="font-semibold">
                                                {arisan.period === 'mingguan' ? 'Mingguan' : 'Bulanan'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-sm text-secondary">
                                                <Users size={16} />
                                                Anggota
                                            </span>
                                            <span className="font-semibold">
                                                {arisan.members.length}/{arisan.totalMembers}
                                                {isFull && <span className="text-error ml-sm">(Penuh)</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isFull ? (
                                    <div className="flex items-center gap-sm p-md text-error" style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-lg)' }}>
                                        <AlertCircle size={20} />
                                        <span className="text-sm">Arisan ini sudah penuh</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Input Nama Lengkap */}
                                        <div className="form-group">
                                            <label className="form-label">Nama Lengkap <span className="text-error">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Masukkan nama lengkap"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>

                                        {/* Input Nomor HP */}
                                        <div className="form-group">
                                            <label className="form-label">Nomor HP <span className="text-error">*</span></label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder="08xxxxxxxxxx"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </div>

                                        {/* Pilih Giliran */}
                                        <div className="form-group">
                                            <label className="form-label">Pilih Giliran <span className="text-error">*</span></label>
                                            <select
                                                className="form-input"
                                                value={selectedTurn}
                                                onChange={(e) => setSelectedTurn(parseInt(e.target.value))}
                                            >
                                                <option value={0}>-- Pilih Giliran --</option>
                                                {availableTurns.map(turn => (
                                                    <option key={turn} value={turn}>
                                                        Giliran ke-{turn}
                                                        {arisan.mode === 'menurun' && ` - ${formatCurrency(calculateContributionForTurn(turn))}`}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="form-helper">
                                                {availableTurns.length} giliran tersedia dari {arisan.totalMembers}
                                            </p>
                                        </div>

                                        {/* Nominal Setoran (Auto-fill) */}
                                        <div className="form-group">
                                            <label className="form-label">Nominal Setoran</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rp</span>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={contributionAmount ? parseInt(contributionAmount).toLocaleString('id-ID') : ''}
                                                    readOnly={arisan.mode === 'menurun'}
                                                    placeholder={selectedTurn > 0 ? '' : 'Pilih giliran dulu'}
                                                    onChange={(e) => arisan.mode !== 'menurun' && setContributionAmount(e.target.value.replace(/\D/g, ''))}
                                                    style={{
                                                        paddingLeft: 40,
                                                        background: arisan.mode === 'menurun' ? 'var(--bg-secondary)' : undefined,
                                                        cursor: arisan.mode === 'menurun' ? 'default' : undefined
                                                    }}
                                                />
                                            </div>
                                            <p className="form-helper">
                                                {arisan.mode === 'menurun'
                                                    ? '📊 Otomatis berdasarkan giliran'
                                                    : `Nominal standar: ${formatCurrency(arisan.nominal)}`}
                                            </p>
                                        </div>

                                        {/* Rekening Admin */}
                                        {arisan.paymentAccounts.length > 0 && (
                                            <div className="mb-md">
                                                <label className="form-label mb-sm">Rekening Pembayaran Admin</label>
                                                <div className="flex flex-col gap-xs">
                                                    {arisan.paymentAccounts.filter(acc => acc.isActive).map(acc => (
                                                        <div key={acc.id} className="p-sm" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                                            <div className="flex items-center gap-sm">
                                                                <span className="badge badge-secondary">{acc.type === 'bank' ? '🏦' : '📱'} {acc.bankName}</span>
                                                            </div>
                                                            <div className="text-sm font-semibold mt-xs">{acc.accountNumber}</div>
                                                            <div className="text-xs text-muted">a.n. {acc.accountHolder}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleJoin}
                                            className="btn btn-primary w-full"
                                            disabled={isJoining}
                                        >
                                            {isJoining ? (
                                                <>
                                                    <Loader2 size={20} className="animate-pulse" />
                                                    Bergabung...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={20} />
                                                    Gabung Arisan
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => {
                                        setInviteCode('');
                                        setError('');
                                    }}
                                    className="btn btn-ghost w-full mt-md"
                                >
                                    Cari Arisan Lain
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-lg">
                    <Link to={isAuthenticated ? '/dashboard' : '/'} className="btn btn-ghost">
                        <ArrowLeft size={18} />
                        {isAuthenticated ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default JoinArisan;
