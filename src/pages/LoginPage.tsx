import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, Mail, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Step = 'email' | 'otp';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, verifyOtp, pendingEmail } = useAuth();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get redirect path from location state
    const redirectPath = (location.state as { redirect?: string })?.redirect || '/dashboard';

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !email.includes('@')) {
            setError('Masukkan email yang valid');
            return;
        }

        setIsLoading(true);
        try {
            await login(email);
            setStep('otp');
        } catch (err) {
            setError('Gagal mengirim OTP. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (otp.length !== 6) {
            setError('Masukkan 6 digit kode OTP');
            return;
        }

        setIsLoading(true);
        try {
            const success = await verifyOtp(otp);
            if (success) {
                navigate(redirectPath);
            } else {
                setError('Kode OTP salah. Coba lagi.');
            }
        } catch (err) {
            setError('Verifikasi gagal. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (value: string) => {
        // Only allow numbers and max 6 digits
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setOtp(cleaned);
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
                        {step === 'email' ? (
                            <>
                                <div className="text-center mb-lg">
                                    <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                        <Mail size={28} />
                                    </div>
                                    <h1 className="text-xl font-bold">Masuk / Daftar</h1>
                                    <p className="text-sm text-muted mt-sm">
                                        Masukkan email untuk melanjutkan
                                    </p>
                                </div>

                                <form onSubmit={handleSendOtp}>
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
                                        {error && <p className="form-helper form-error">{error}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={20} className="animate-pulse" />
                                                Mengirim...
                                            </>
                                        ) : (
                                            'Kirim Kode OTP'
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-sm text-muted mt-lg">
                                    Dengan melanjutkan, kamu menyetujui<br />
                                    <a href="#">Syarat & Ketentuan</a> kami
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-lg">
                                    <div className="avatar avatar-lg mx-auto mb-md" style={{ margin: '0 auto', marginBottom: 'var(--space-md)' }}>
                                        <KeyRound size={28} />
                                    </div>
                                    <h1 className="text-xl font-bold">Verifikasi OTP</h1>
                                    <p className="text-sm text-muted mt-sm">
                                        Masukkan 6 digit kode yang dikirim ke<br />
                                        <strong>{pendingEmail}</strong>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp}>
                                    <div className="form-group">
                                        <label className="form-label">Kode OTP</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className={`form-input text-center text-2xl font-bold ${error ? 'form-input-error' : ''}`}
                                            placeholder="• • • • • •"
                                            value={otp}
                                            onChange={(e) => handleOtpChange(e.target.value)}
                                            autoFocus
                                            disabled={isLoading}
                                            style={{ letterSpacing: '0.5em' }}
                                        />
                                        {error && <p className="form-helper form-error">{error}</p>}
                                        <p className="form-helper">
                                            💡 Hint: Gunakan <strong>123456</strong> untuk testing
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full"
                                        disabled={isLoading || otp.length !== 6}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={20} className="animate-pulse" />
                                                Memverifikasi...
                                            </>
                                        ) : (
                                            'Verifikasi'
                                        )}
                                    </button>
                                </form>

                                <button
                                    type="button"
                                    className="btn btn-ghost w-full mt-md"
                                    onClick={() => {
                                        setStep('email');
                                        setOtp('');
                                        setError('');
                                    }}
                                >
                                    <ArrowLeft size={18} />
                                    Ganti Email
                                </button>
                            </>
                        )}
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
