import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Wallet, Plus, LinkIcon, LogOut, Settings,
    Users, Calendar, ArrowRight, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArisan } from '../context/ArisanContext';
import { formatCurrency } from '../data/mockData';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { getUserArisans, isLoading } = useArisan();

    const userArisans = getUserArisans();
    const activeArisans = userArisans.filter(a => a.status === 'aktif');
    const completedArisans = userArisans.filter(a => a.status === 'selesai');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getUserTurnOrder = (arisan: typeof userArisans[0]): number | null => {
        const member = arisan.members.find(m => m.userId === user?.id);
        return member?.turnOrder || null;
    };

    const isUserAdmin = (arisan: typeof userArisans[0]): boolean => {
        return arisan.createdBy === user?.id;
    };

    return (
        <div className="page">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <Link to="/" className="logo">
                        <div className="logo-icon">
                            <Wallet size={20} />
                        </div>
                        <span>Arisan Online</span>
                    </Link>
                    <div className="flex gap-sm">
                        <button className="btn btn-ghost btn-icon" title="Pengaturan">
                            <Settings size={20} />
                        </button>
                        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Keluar">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container py-lg">
                {/* Greeting */}
                <div className="mb-xl animate-slide-up">
                    <h1 className="text-2xl font-bold">
                        👋 Hai, {user?.name || 'User'}!
                    </h1>
                    <p className="text-muted mt-xs">
                        {activeArisans.length > 0
                            ? `Kamu punya ${activeArisans.length} arisan aktif`
                            : 'Belum ada arisan. Yuk mulai!'}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-md mb-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <button
                        onClick={() => navigate('/create')}
                        className="card card-body flex flex-col items-center gap-sm py-lg"
                        style={{ border: '2px dashed var(--primary)', background: 'var(--primary-bg)' }}
                    >
                        <div className="avatar" style={{ background: 'var(--primary)' }}>
                            <Plus size={24} />
                        </div>
                        <span className="font-semibold text-primary-color">Buat Arisan</span>
                    </button>

                    <button
                        onClick={() => navigate('/join')}
                        className="card card-body flex flex-col items-center gap-sm py-lg"
                        style={{ border: '2px dashed var(--border)' }}
                    >
                        <div className="avatar" style={{ background: 'var(--text-muted)' }}>
                            <LinkIcon size={24} />
                        </div>
                        <span className="font-semibold">Join Arisan</span>
                    </button>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col gap-md">
                        {[1, 2].map(i => (
                            <div key={i} className="card card-body">
                                <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '12px' }} />
                                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Active Arisans */}
                        <section className="mb-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <h2 className="text-lg font-semibold mb-md flex items-center gap-sm">
                                <span className="badge badge-success">Aktif</span>
                                Arisan Berjalan
                            </h2>

                            {activeArisans.length > 0 ? (
                                <div className="flex flex-col gap-md">
                                    {activeArisans.map(arisan => (
                                        <Link
                                            key={arisan.id}
                                            to={`/arisan/${arisan.id}`}
                                            className="card list-item"
                                        >
                                            <div className="avatar">
                                                {arisan.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="list-item-content">
                                                <div className="list-item-title flex items-center gap-sm">
                                                    {arisan.name}
                                                    {isUserAdmin(arisan) && (
                                                        <Crown size={14} className="text-warning" />
                                                    )}
                                                </div>
                                                <div className="list-item-subtitle flex items-center gap-md">
                                                    <span className="flex items-center gap-xs">
                                                        <Wallet size={14} />
                                                        {formatCurrency(arisan.nominal)}
                                                    </span>
                                                    <span className="flex items-center gap-xs">
                                                        <Users size={14} />
                                                        {arisan.members.length}/{arisan.totalMembers}
                                                    </span>
                                                    <span className="flex items-center gap-xs">
                                                        <Calendar size={14} />
                                                        {arisan.period === 'mingguan' ? 'Mingguan' : 'Bulanan'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-xs">
                                                {getUserTurnOrder(arisan) && (
                                                    <span className="badge badge-primary">
                                                        Giliran ke-{getUserTurnOrder(arisan)}
                                                    </span>
                                                )}
                                                <ArrowRight size={20} className="text-muted" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="card card-body empty-state">
                                    <div className="empty-state-icon">
                                        <Wallet />
                                    </div>
                                    <p className="empty-state-title">Belum Ada Arisan Aktif</p>
                                    <p className="empty-state-desc">
                                        Buat arisan baru atau join arisan yang sudah ada
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Completed Arisans */}
                        {completedArisans.length > 0 && (
                            <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <h2 className="text-lg font-semibold mb-md flex items-center gap-sm">
                                    <span className="badge badge-secondary">Selesai</span>
                                    Riwayat Arisan
                                </h2>

                                <div className="flex flex-col gap-md">
                                    {completedArisans.map(arisan => (
                                        <Link
                                            key={arisan.id}
                                            to={`/arisan/${arisan.id}`}
                                            className="card list-item"
                                            style={{ opacity: 0.7 }}
                                        >
                                            <div className="avatar" style={{ background: 'var(--text-muted)' }}>
                                                {arisan.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="list-item-content">
                                                <div className="list-item-title">{arisan.name}</div>
                                                <div className="list-item-subtitle">
                                                    {formatCurrency(arisan.nominal)} • {arisan.totalMembers} anggota
                                                </div>
                                            </div>
                                            <ArrowRight size={20} className="text-muted" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <Link to="/dashboard" className="nav-item active">
                    <Wallet />
                    <span>Arisan</span>
                </Link>
                <Link to="/settings" className="nav-item">
                    <Settings />
                    <span>Pengaturan</span>
                </Link>
            </nav>
        </div>
    );
};

export default Dashboard;
