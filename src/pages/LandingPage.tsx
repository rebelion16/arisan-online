import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Users, CheckCircle, Eye, ArrowRight, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const handleBuatArisan = () => {
        if (isAuthenticated) {
            navigate('/create');
        } else {
            navigate('/login', { state: { redirect: '/create' } });
        }
    };

    const handleJoinArisan = () => {
        if (isAuthenticated) {
            navigate('/join');
        } else {
            navigate('/login', { state: { redirect: '/join' } });
        }
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
                    <div className="flex items-center gap-sm">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="btn btn-ghost btn-icon"
                            title={isDark ? 'Light Mode' : 'Dark Mode'}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="btn btn-primary btn-sm">
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-outline btn-sm">
                                Masuk
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="animate-slide-up">
                        <span className="badge badge-primary mb-md">
                            Buku Arisan Digital
                        </span>
                        <h1 className="hero-title">
                            Arisan Jadi Rapi,<br />
                            Transparan, & Nggak Ribet
                        </h1>
                        <p className="hero-subtitle">
                            Kelola arisan dengan mudah. Giliran jelas, setoran tercatat otomatis,
                            dan semua anggota bisa pantau kapan saja.
                        </p>
                        <div className="hero-actions">
                            <button onClick={handleBuatArisan} className="btn btn-primary btn-lg">
                                <Wallet size={20} />
                                Buat Arisan
                            </button>
                            <button onClick={handleJoinArisan} className="btn btn-outline btn-lg">
                                <Users size={20} />
                                Join Arisan
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <div className="feature-grid">
                        <div className="card feature-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="feature-icon">
                                <CheckCircle />
                            </div>
                            <h3 className="feature-title">Giliran Jelas</h3>
                            <p className="feature-desc">
                                Tentukan giliran secara manual atau undian transparan.
                                Tidak ada lagi kebingungan siapa yang dapat giliran.
                            </p>
                        </div>

                        <div className="card feature-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="feature-icon">
                                <Wallet />
                            </div>
                            <h3 className="feature-title">Setoran Tercatat</h3>
                            <p className="feature-desc">
                                Setiap pembayaran tercatat otomatis dengan tanggal dan bukti.
                                Tidak perlu lagi mencatat manual.
                            </p>
                        </div>

                        <div className="card feature-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="feature-icon">
                                <Eye />
                            </div>
                            <h3 className="feature-title">Semua Bisa Lihat</h3>
                            <p className="feature-desc">
                                Transparansi penuh. Semua anggota bisa melihat status setoran
                                dan riwayat arisan kapan saja.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-xl">
                <div className="container">
                    <div className="card card-glass p-xl text-center">
                        <h2 className="text-2xl font-bold mb-md">Siap Memulai Arisan?</h2>
                        <p className="text-secondary mb-lg">
                            Gratis untuk semua fitur. Tidak perlu download aplikasi.
                        </p>
                        <button onClick={handleBuatArisan} className="btn btn-primary btn-lg">
                            Mulai Sekarang
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-lg" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="container text-center">
                    <p className="text-sm text-muted">
                        © 2025 Arisan Online Digital. Buku Arisan Digital untuk Indonesia - Dibuat oleh Rebelion_16.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
