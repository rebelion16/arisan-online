import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Wallet, Users, Shuffle,
    Check, Share2, Copy, Crown, DollarSign, Calendar,
    Plus, Trash2, GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useArisan } from '../../context/ArisanContext';
import type { CreateArisanFormData, ArisanPeriod, TurnMethod, Member } from '../../types';

type Step = 1 | 2 | 3 | 4;

interface MemberInput {
    name: string;
    phone: string;
    role: 'ketua' | 'bendahara' | 'anggota';
    contributionAmount: string; // Individual iuran amount
}

const CreateArisan: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createArisan } = useArisan();

    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [createdArisan, setCreatedArisan] = useState<{ id: string; inviteCode: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [nominal, setNominal] = useState('');
    const [period, setPeriod] = useState<ArisanPeriod>('bulanan');
    const [totalMembers, setTotalMembers] = useState('10');

    // Members state
    const [members, setMembers] = useState<MemberInput[]>([
        { name: user?.name || '', phone: user?.phone || '', role: 'ketua', contributionAmount: '' },
    ]);
    const [sameBendahara, setSameBendahara] = useState(true);

    // Turn order state
    const [turnMethod, setTurnMethod] = useState<TurnMethod>('undian');
    const [turnOrder, setTurnOrder] = useState<string[]>([]);

    const canProceed = () => {
        switch (step) {
            case 1:
                return name.trim() && parseInt(nominal) > 0 && parseInt(totalMembers) >= 2;
            case 2:
                return members.length >= 1 && members.every(m => m.name.trim());
            case 3:
                return turnMethod && (turnMethod === 'undian' || turnOrder.length > 0);
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (step < 4) {
            if (step === 2) {
                // Auto-generate turn order for step 3
                const memberNames = members.map(m => m.name);
                if (turnMethod === 'undian') {
                    // Shuffle
                    const shuffled = [...memberNames].sort(() => Math.random() - 0.5);
                    setTurnOrder(shuffled);
                } else {
                    setTurnOrder(memberNames);
                }
            }
            setStep((step + 1) as Step);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((step - 1) as Step);
        }
    };

    const handleShuffle = () => {
        const shuffled = [...turnOrder].sort(() => Math.random() - 0.5);
        setTurnOrder(shuffled);
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        const newOrder = [...turnOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setTurnOrder(newOrder);
    };

    const handleMoveDown = (index: number) => {
        if (index >= turnOrder.length - 1) return;
        const newOrder = [...turnOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        setTurnOrder(newOrder);
    };

    const handleAddMember = () => {
        setMembers([...members, { name: '', phone: '', role: 'anggota', contributionAmount: nominal }]);
    };

    const handleRemoveMember = (index: number) => {
        if (members[index].role !== 'ketua') {
            setMembers(members.filter((_, i) => i !== index));
        }
    };

    const handleMemberChange = (index: number, field: keyof MemberInput, value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        setMembers(updated);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const formData: CreateArisanFormData = {
                name,
                nominal: parseInt(nominal),
                period,
                totalMembers: parseInt(totalMembers),
                members: members.map(m => ({
                    name: m.name,
                    phone: m.phone,
                    role: m.role,
                    turnOrder: turnOrder.indexOf(m.name) + 1,
                    contributionAmount: parseInt(m.contributionAmount) || parseInt(nominal),
                })) as Omit<Member, 'id' | 'joinedAt' | 'status'>[],
                turnMethod,
                turnOrder,
            };

            const arisan = await createArisan(formData);
            setCreatedArisan({ id: arisan.id, inviteCode: arisan.inviteCode });
            setStep(4);
        } catch (error) {
            console.error('Failed to create arisan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (!createdArisan) return;
        const link = `${window.location.origin}/join/${createdArisan.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        if (!createdArisan) return;
        const link = `${window.location.origin}/join/${createdArisan.inviteCode}`;
        const text = `Hai! Yuk gabung arisan *${name}*!\n\n💰 Nominal: Rp ${parseInt(nominal).toLocaleString('id-ID')}\n📅 Periode: ${period === 'mingguan' ? 'Mingguan' : 'Bulanan'}\n\nKlik untuk gabung:\n${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const formatNominal = (value: string) => {
        const num = value.replace(/\D/g, '');
        return num ? parseInt(num).toLocaleString('id-ID') : '';
    };

    return (
        <div className="page">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <button onClick={() => step === 1 ? navigate(-1) : handleBack()} className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-semibold" style={{ flex: 1, textAlign: 'center' }}>
                        Buat Arisan
                    </h1>
                    <div style={{ width: 44 }} />
                </div>
            </header>

            {/* Progress Steps */}
            <div className="steps">
                {[1, 2, 3, 4].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`step ${step === s ? 'step-active' : ''} ${step > s ? 'step-completed' : ''}`}>
                            <div className="step-number">
                                {step > s ? <Check size={16} /> : s}
                            </div>
                        </div>
                        {s < 4 && <div className="step-line" />}
                    </React.Fragment>
                ))}
            </div>

            <main className="container py-lg">
                {/* Step 1: Info Arisan */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-xl">
                            <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                <Wallet size={28} />
                            </div>
                            <h2 className="text-xl font-bold">Info Arisan</h2>
                            <p className="text-sm text-muted mt-xs">Isi detail arisan yang akan dibuat</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nama Arisan</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Contoh: Arisan Keluarga"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nominal Setoran Awal</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="form-input"
                                    placeholder="500.000"
                                    value={formatNominal(nominal)}
                                    onChange={(e) => setNominal(e.target.value.replace(/\D/g, ''))}
                                    style={{ paddingLeft: 48 }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Periode</label>
                            <div className="grid grid-cols-2 gap-md">
                                <button
                                    type="button"
                                    className={`card card-body text-center ${period === 'mingguan' ? 'card-glass' : ''}`}
                                    style={period === 'mingguan' ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)' } : {}}
                                    onClick={() => setPeriod('mingguan')}
                                >
                                    <Calendar size={24} className={period === 'mingguan' ? 'text-primary-color' : 'text-muted'} />
                                    <span className="font-medium mt-sm">Mingguan</span>
                                </button>
                                <button
                                    type="button"
                                    className={`card card-body text-center ${period === 'bulanan' ? 'card-glass' : ''}`}
                                    style={period === 'bulanan' ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)' } : {}}
                                    onClick={() => setPeriod('bulanan')}
                                >
                                    <Calendar size={24} className={period === 'bulanan' ? 'text-primary-color' : 'text-muted'} />
                                    <span className="font-medium mt-sm">Bulanan</span>
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Jumlah Anggota</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                className="form-input"
                                placeholder="10"
                                min="2"
                                max="50"
                                value={totalMembers}
                                onChange={(e) => setTotalMembers(e.target.value)}
                            />
                            <p className="form-helper">Minimum 2 anggota</p>
                        </div>
                    </div>
                )}

                {/* Step 2: Struktur Anggota */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-xl">
                            <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                <Users size={28} />
                            </div>
                            <h2 className="text-xl font-bold">Struktur Anggota</h2>
                            <p className="text-sm text-muted mt-xs">Tentukan ketua, bendahara, dan anggota</p>
                        </div>

                        {/* Ketua */}
                        <div className="card card-body mb-md" style={{ borderColor: 'var(--primary)' }}>
                            <div className="flex items-center gap-sm mb-md">
                                <Crown size={18} className="text-warning" />
                                <span className="font-semibold">Ketua / Admin</span>
                                <span className="badge badge-primary">Kamu</span>
                            </div>
                            <div className="grid grid-cols-1 gap-sm">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nama"
                                    value={members[0].name}
                                    onChange={(e) => handleMemberChange(0, 'name', e.target.value)}
                                />
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="No. HP (opsional)"
                                    value={members[0].phone}
                                    onChange={(e) => handleMemberChange(0, 'phone', e.target.value)}
                                />
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="form-input"
                                        placeholder="Iuran Bulanan"
                                        value={formatNominal(members[0].contributionAmount)}
                                        onChange={(e) => handleMemberChange(0, 'contributionAmount', e.target.value.replace(/\D/g, ''))}
                                        style={{ paddingLeft: 48 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bendahara */}
                        <div className="card card-body mb-md">
                            <div className="flex items-center justify-between mb-md">
                                <div className="flex items-center gap-sm">
                                    <DollarSign size={18} className="text-primary-color" />
                                    <span className="font-semibold">Bendahara</span>
                                </div>
                                <label className="flex items-center gap-sm text-sm">
                                    <input
                                        type="checkbox"
                                        checked={sameBendahara}
                                        onChange={(e) => setSameBendahara(e.target.checked)}
                                    />
                                    Sama dengan Ketua
                                </label>
                            </div>

                            {!sameBendahara && (
                                <div className="grid grid-cols-1 gap-sm">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nama Bendahara"
                                    />
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="No. HP"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Anggota List */}
                        <div className="card card-body">
                            <div className="flex items-center justify-between mb-md">
                                <div className="flex items-center gap-sm">
                                    <Users size={18} />
                                    <span className="font-semibold">Anggota</span>
                                </div>
                                <span className="text-sm text-muted">
                                    {members.length - 1}/{parseInt(totalMembers) - 1} anggota
                                </span>
                            </div>

                            <div className="flex flex-col gap-sm">
                                {members.slice(1).map((member, index) => (
                                    <div key={index + 1} className="flex flex-col gap-xs p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <div className="flex gap-sm items-center">
                                            <span className="text-sm text-muted" style={{ width: 24 }}>{index + 2}.</span>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Nama"
                                                value={member.name}
                                                onChange={(e) => handleMemberChange(index + 1, 'name', e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleRemoveMember(index + 1)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <div className="flex gap-sm items-center" style={{ paddingLeft: 32 }}>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                placeholder="No. HP"
                                                value={member.phone}
                                                onChange={(e) => handleMemberChange(index + 1, 'phone', e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Rp</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="form-input"
                                                    placeholder="Iuran"
                                                    value={formatNominal(member.contributionAmount)}
                                                    onChange={(e) => handleMemberChange(index + 1, 'contributionAmount', e.target.value.replace(/\D/g, ''))}
                                                    style={{ paddingLeft: 36 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddMember}
                                className="btn btn-outline w-full mt-md"
                                disabled={members.length >= parseInt(totalMembers)}
                            >
                                <Plus size={18} />
                                Tambah Anggota
                            </button>

                            <p className="text-sm text-muted text-center mt-md">
                                💡 Anggota lain bisa bergabung via link nanti
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3: Atur Giliran */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-xl">
                            <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                <Shuffle size={28} />
                            </div>
                            <h2 className="text-xl font-bold">Atur Giliran</h2>
                            <p className="text-sm text-muted mt-xs">Tentukan urutan giliran arisan</p>
                        </div>

                        <div className="grid grid-cols-2 gap-md mb-lg">
                            <button
                                type="button"
                                className={`card card-body text-center ${turnMethod === 'manual' ? 'card-glass' : ''}`}
                                style={turnMethod === 'manual' ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)' } : {}}
                                onClick={() => setTurnMethod('manual')}
                            >
                                <GripVertical size={24} className={turnMethod === 'manual' ? 'text-primary-color' : 'text-muted'} />
                                <span className="font-medium mt-sm">Manual</span>
                                <span className="text-xs text-muted">Atur sendiri</span>
                            </button>
                            <button
                                type="button"
                                className={`card card-body text-center ${turnMethod === 'undian' ? 'card-glass' : ''}`}
                                style={turnMethod === 'undian' ? { borderColor: 'var(--primary)', background: 'var(--primary-bg)' } : {}}
                                onClick={() => {
                                    setTurnMethod('undian');
                                    handleShuffle();
                                }}
                            >
                                <Shuffle size={24} className={turnMethod === 'undian' ? 'text-primary-color' : 'text-muted'} />
                                <span className="font-medium mt-sm">Undian</span>
                                <span className="text-xs text-muted">Acak otomatis</span>
                            </button>
                        </div>

                        {turnMethod === 'undian' && (
                            <button
                                type="button"
                                onClick={handleShuffle}
                                className="btn btn-secondary w-full mb-lg"
                            >
                                <Shuffle size={18} />
                                Kocok Ulang
                            </button>
                        )}

                        <div className="card card-body">
                            <h4 className="font-semibold mb-md">Urutan Giliran</h4>
                            <div className="flex flex-col gap-sm">
                                {turnOrder.map((name, index) => (
                                    <div key={index} className="list-item">
                                        <div className="avatar avatar-sm">{index + 1}</div>
                                        <div className="list-item-content">
                                            <span className="font-medium">{name}</span>
                                        </div>
                                        {index === 0 && <span className="badge badge-primary">Pertama</span>}
                                        {turnMethod === 'manual' && (
                                            <div className="flex gap-xs">
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    title="Naikkan"
                                                >
                                                    <ChevronUp size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === turnOrder.length - 1}
                                                    title="Turunkan"
                                                >
                                                    <ChevronDown size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Selesai */}
                {step === 4 && createdArisan && (
                    <div className="animate-fade-in text-center">
                        <div className="avatar avatar-lg mx-auto mb-lg" style={{ margin: '0 auto', marginBottom: 'var(--space-lg)', background: 'var(--success)' }}>
                            <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-sm">Arisan Berhasil Dibuat! 🎉</h2>
                        <p className="text-secondary mb-xl">Undang anggota untuk bergabung</p>

                        <div className="card card-body mb-lg">
                            <p className="text-sm text-muted mb-sm">Link Undangan:</p>
                            <div className="flex gap-sm">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={`${window.location.origin}/join/${createdArisan.inviteCode}`}
                                    readOnly
                                    style={{ fontSize: 'var(--font-size-sm)' }}
                                />
                                <button onClick={handleCopyLink} className="btn btn-secondary btn-icon">
                                    <Copy size={18} />
                                </button>
                            </div>
                            {copied && <p className="text-sm text-success mt-sm">✓ Link disalin!</p>}
                        </div>

                        <button onClick={handleShareWhatsApp} className="btn btn-primary w-full mb-md">
                            <Share2 size={18} />
                            Share ke WhatsApp
                        </button>

                        <Link to={`/arisan/${createdArisan.id}`} className="btn btn-outline w-full">
                            Lihat Arisan
                        </Link>
                    </div>
                )}
            </main>

            {/* Footer Actions */}
            {step < 4 && (
                <footer style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                    <div className="container flex gap-md">
                        {step > 1 && (
                            <button onClick={handleBack} className="btn btn-secondary" style={{ flex: 1 }}>
                                <ArrowLeft size={18} />
                                Kembali
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                                disabled={!canProceed()}
                            >
                                Lanjut
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                                disabled={isLoading || !canProceed()}
                            >
                                {isLoading ? 'Membuat...' : 'Buat Arisan'}
                                <Check size={18} />
                            </button>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
};

export default CreateArisan;
