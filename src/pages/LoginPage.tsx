import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, ArrowLeft, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginWithGoogle, register } = useAuth();

    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get redirect path from location state
    const redirectPath = (location.state as { redirect?: string })?.redirect || '/dashboard';

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                navigate(redirectPath);
            } else {
                setError(result.error || 'Login dengan Google gagal');
            }
        } catch (err) {
            setError('Login dengan Google gagal. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

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

                        {/* Divider */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            margin: 'var(--space-lg) 0'
                        }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                            <span className="text-sm text-muted">atau</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                        </div>

                        {/* Google Sign-In Button */}
                        <button
                            type="button"
                            className="btn btn-outline w-full"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-sm)',
                            }}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-pulse" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            )}
                            Lanjutkan dengan Google
                        </button>

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
