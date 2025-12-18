import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, ArrowLeft, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();

    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get redirect path from location state
    const redirectPath = (location.state as { redirect?: string })?.redirect || '/dashboard';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !email.includes('@')) {
            setError('Masukkan email yang valid');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate(redirectPath);
            } else {
                setError(result.error || 'Login gagal');
            }
        } catch (err) {
            setError('Login gagal. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Masukkan nama lengkap');
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            setError('Masukkan email yang valid');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setIsLoading(true);
        try {
            const result = await register(email, password, name);
            if (result.success) {
                navigate(redirectPath);
            } else {
                setError(result.error || 'Registrasi gagal');
            }
        } catch (err) {
            setError('Registrasi gagal. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setPassword('');
    };

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
                        <div className="text-center mb-lg">
                            <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                {mode === 'login' ? <Mail size={28} /> : <User size={28} />}
                            </div>
                            <h1 className="text-xl font-bold">
                                {mode === 'login' ? 'Masuk' : 'Daftar Akun Baru'}
                            </h1>
                            <p className="text-sm text-muted mt-sm">
                                {mode === 'login'
                                    ? 'Masukkan email dan password'
                                    : 'Buat akun untuk mulai arisan'}
                            </p>
                        </div>

                        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                            {mode === 'register' && (
                                <div className="form-group">
                                    <label className="form-label">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nama kamu"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className={`form-input ${error ? 'form-input-error' : ''}`}
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input ${error ? 'form-input-error' : ''}`}
                                        placeholder="Minimal 6 karakter"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="form-helper form-error">{error}</p>}

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-md"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-pulse" />
                                        {mode === 'login' ? 'Masuk...' : 'Mendaftar...'}
                                    </>
                                ) : (
                                    <>
                                        {mode === 'login' ? <Lock size={18} /> : <User size={18} />}
                                        {mode === 'login' ? 'Masuk' : 'Daftar'}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-lg">
                            <p className="text-sm text-muted">
                                {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                            </p>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm mt-sm"
                                onClick={switchMode}
                            >
                                {mode === 'login' ? 'Daftar Sekarang' : 'Masuk'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-lg">
                    <Link to="/" className="btn btn-ghost">
                        <ArrowLeft size={18} />
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
