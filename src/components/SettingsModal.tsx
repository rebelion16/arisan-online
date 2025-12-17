import React, { useState } from 'react';
import { X, Settings, Users, AlertTriangle, Shuffle, Play } from 'lucide-react';
import type { Arisan, ArisanSettings, Member } from '../types';
import { formatCurrency } from '../data/mockData';
import { useToast } from '../context/ToastContext';

interface SettingsModalProps {
    arisan: Arisan;
    isOpen: boolean;
    onClose: () => void;
    onUpdateSettings: (settings: Partial<ArisanSettings>) => void;
    onUpdateArisan: (data: Partial<Arisan>) => void;
    onRemoveMember: (memberId: string) => void;
    onUpdateMemberRole: (memberId: string, role: Member['role']) => void;
    onRandomDraw: () => void;
    onStartNewRound: () => void;
}

type SettingsTab = 'info' | 'members' | 'penalty' | 'actions';

const SettingsModal: React.FC<SettingsModalProps> = ({
    arisan,
    isOpen,
    onClose,
    onUpdateSettings,
    onUpdateArisan,
    onRemoveMember,
    onUpdateMemberRole,
    onRandomDraw,
    onStartNewRound,
}) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<SettingsTab>('info');
    const [editName, setEditName] = useState(arisan.name);
    const [editNominal, setEditNominal] = useState(arisan.nominal.toString());
    const [editTotalMembers, setEditTotalMembers] = useState(arisan.totalMembers.toString());

    if (!isOpen) return null;

    const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { key: 'info', label: 'Info', icon: <Settings size={16} /> },
        { key: 'members', label: 'Anggota', icon: <Users size={16} /> },
        { key: 'penalty', label: 'Denda', icon: <AlertTriangle size={16} /> },
        { key: 'actions', label: 'Aksi', icon: <Play size={16} /> },
    ];

    const handleSaveInfo = () => {
        onUpdateArisan({
            name: editName,
            nominal: parseInt(editNominal) || arisan.nominal,
            totalMembers: parseInt(editTotalMembers) || arisan.totalMembers,
        });
        showToast('Info arisan berhasil diperbarui', 'success');
    };

    const handleTogglePenalty = () => {
        onUpdateSettings({ penaltyEnabled: !arisan.settings.penaltyEnabled });
        showToast(arisan.settings.penaltyEnabled ? 'Denda dinonaktifkan' : 'Denda diaktifkan', 'info');
    };

    const handleToggleReminder = () => {
        onUpdateSettings({ reminderEnabled: !arisan.settings.reminderEnabled });
        showToast(arisan.settings.reminderEnabled ? 'Reminder dinonaktifkan' : 'Reminder diaktifkan', 'info');
    };

    const handleRemoveMember = (memberId: string, memberName: string) => {
        if (window.confirm(`Hapus ${memberName} dari arisan?`)) {
            onRemoveMember(memberId);
            showToast(`${memberName} telah dihapus dari arisan`, 'warning');
        }
    };

    const handleUpdateRole = (memberId: string, role: Member['role'], memberName: string) => {
        onUpdateMemberRole(memberId, role);
        showToast(`Role ${memberName} diubah menjadi ${role}`, 'success');
    };

    const handleRandomDraw = () => {
        if (window.confirm('Undi ulang giliran? Urutan akan diacak.')) {
            onRandomDraw();
            showToast('Giliran berhasil diacak!', 'success');
        }
    };

    const handleStartNewRound = () => {
        if (window.confirm('Mulai putaran baru? Status bayar akan di-reset.')) {
            onStartNewRound();
            showToast(`Putaran ${arisan.currentRound + 1} berhasil dimulai!`, 'success');
            onClose();
        }
    };

    return (
        <div className="modal-overlay open" onClick={onClose}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '85vh' }}
            >
                {/* Header */}
                <div className="modal-header">
                    <h2 className="font-bold">⚙️ Pengaturan Arisan</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="tabs" style={{ padding: '0 var(--space-md)', borderBottom: '1px solid var(--border)' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab flex items-center gap-xs ${activeTab === tab.key ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="modal-body" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div className="flex flex-col gap-md">
                            <div className="form-group">
                                <label className="form-label">Nama Arisan</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nominal Standar</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="form-input"
                                        value={editNominal}
                                        onChange={e => setEditNominal(e.target.value.replace(/\D/g, ''))}
                                        style={{ paddingLeft: 40 }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Anggota</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editTotalMembers}
                                    onChange={e => setEditTotalMembers(e.target.value)}
                                    min={arisan.members.length}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Periode</label>
                                <select
                                    className="form-input"
                                    value={arisan.period}
                                    onChange={e => onUpdateArisan({ period: e.target.value as 'mingguan' | 'bulanan' })}
                                >
                                    <option value="mingguan">Mingguan</option>
                                    <option value="bulanan">Bulanan</option>
                                </select>
                            </div>
                            <button onClick={handleSaveInfo} className="btn btn-primary">
                                Simpan Perubahan
                            </button>
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="flex flex-col gap-sm">
                            {arisan.members.map(member => (
                                <div key={member.id} className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <div>
                                        <div className="font-semibold">{member.name}</div>
                                        <div className="text-xs text-muted">{formatCurrency(member.contributionAmount)}</div>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <select
                                            className="form-input"
                                            value={member.role}
                                            onChange={e => handleUpdateRole(member.id, e.target.value as Member['role'], member.name)}
                                            style={{ padding: '4px 8px', minHeight: 'auto' }}
                                        >
                                            <option value="ketua">Ketua</option>
                                            <option value="bendahara">Bendahara</option>
                                            <option value="anggota">Anggota</option>
                                        </select>
                                        {member.role !== 'ketua' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                className="btn btn-ghost btn-sm text-error"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Penalty Tab */}
                    {activeTab === 'penalty' && (
                        <div className="flex flex-col gap-md">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">Aktifkan Denda</div>
                                    <div className="text-xs text-muted">Denda untuk keterlambatan bayar</div>
                                </div>
                                <button
                                    onClick={handleTogglePenalty}
                                    className={`btn btn-sm ${arisan.settings.penaltyEnabled ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {arisan.settings.penaltyEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {arisan.settings.penaltyEnabled && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Tipe Denda</label>
                                        <select
                                            className="form-input"
                                            value={arisan.settings.penaltyType}
                                            onChange={e => onUpdateSettings({ penaltyType: e.target.value as 'percentage' | 'fixed' })}
                                        >
                                            <option value="percentage">Persentase per Hari</option>
                                            <option value="fixed">Nominal Tetap per Hari</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            {arisan.settings.penaltyType === 'percentage' ? 'Persentase (%)' : 'Nominal (Rp)'}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder={arisan.settings.penaltyType === 'percentage' ? 'Contoh: 1' : 'Contoh: 5000'}
                                            value={arisan.settings.penaltyAmount || ''}
                                            onChange={e => onUpdateSettings({ penaltyAmount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </>
                            )}

                            <hr style={{ borderColor: 'var(--border)' }} />

                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">Reminder Otomatis</div>
                                    <div className="text-xs text-muted">Pengingat sebelum jatuh tempo</div>
                                </div>
                                <button
                                    onClick={handleToggleReminder}
                                    className={`btn btn-sm ${arisan.settings.reminderEnabled ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {arisan.settings.reminderEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {arisan.settings.reminderEnabled && (
                                <div className="form-group">
                                    <label className="form-label">Waktu Reminder</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={arisan.settings.reminderTime}
                                        onChange={e => onUpdateSettings({ reminderTime: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions Tab */}
                    {activeTab === 'actions' && (
                        <div className="flex flex-col gap-md">
                            <div className="card card-body" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-md mb-md">
                                    <div className="avatar" style={{ background: 'var(--primary)' }}>
                                        <Shuffle size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Undi Ulang Giliran</div>
                                        <div className="text-xs text-muted">Acak urutan giliran secara random</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRandomDraw}
                                    className="btn btn-outline w-full"
                                >
                                    <Shuffle size={16} />
                                    Undi Sekarang
                                </button>
                            </div>

                            <div className="card card-body" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center gap-md mb-md">
                                    <div className="avatar" style={{ background: 'var(--success)' }}>
                                        <Play size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Mulai Putaran Baru</div>
                                        <div className="text-xs text-muted">
                                            Putaran saat ini: {arisan.currentRound} / {arisan.totalMembers}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleStartNewRound}
                                    className="btn btn-primary w-full"
                                    disabled={arisan.currentRound >= arisan.totalMembers}
                                >
                                    <Play size={16} />
                                    Mulai Putaran {arisan.currentRound + 1}
                                </button>
                            </div>

                            {/* Statistics */}
                            <div className="card card-body" style={{ background: 'var(--bg-secondary)' }}>
                                <h4 className="font-semibold mb-md">📊 Statistik</h4>
                                <div className="flex flex-col gap-sm text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Total Anggota</span>
                                        <span className="font-semibold">{arisan.members.length} / {arisan.totalMembers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Putaran</span>
                                        <span className="font-semibold">{arisan.currentRound} / {arisan.totalMembers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Target per Putaran</span>
                                        <span className="font-semibold">{formatCurrency(arisan.nominal * arisan.members.length)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Total Target</span>
                                        <span className="font-semibold">{formatCurrency(arisan.nominal * arisan.members.length * arisan.totalMembers)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
