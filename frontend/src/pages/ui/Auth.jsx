import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../../components/header/Header';
import { useAuth } from '../../contexts/AuthContext';
import { SeoMeta } from '../../components/seo/SeoMeta';
import { ROUTES } from '../../app/routes';
import style from './Auth.module.scss';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { sendCode, login, isAuthenticated } = useAuth();
    const isRegister = searchParams.get('register') === 'true';
    const redirectTo = location.state?.from || ROUTES.home;
    
    const [step, setStep] = useState(1); // 1: email, 2: code
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendInterval, setResendInterval] = useState(null);

    // Если пользователь уже авторизован, перенаправляем на главную
    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, navigate, redirectTo]);

    // Таймер для повторной отправки
    useEffect(() => {
        if (resendTimer > 0 && !resendInterval) {
            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setResendInterval(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            setResendInterval(interval);
        }

        return () => {
            if (resendInterval) {
                clearInterval(resendInterval);
            }
        };
    }, [resendTimer, resendInterval]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email.trim()) {
            setError('Введите email');
            return;
        }

        setLoading(true);
        const result = await sendCode(email.trim());
        setLoading(false);

        if (result.success) {
            setStep(2);
            setResendTimer(120);
        } else {
            setError(result.error || 'Ошибка отправки кода');
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const codeDigits = code.replace(/\s/g, '');
        if (codeDigits.length < 5) {
            setError('Код должен содержать 5 цифр');
            return;
        }

        setLoading(true);
        const result = await login(email.trim(), codeDigits);
        setLoading(false);

        if (result.success) {
            navigate(redirectTo, { replace: true });
        } else {
            setError(result.error || 'Неверный код');
        }
    };

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResend = async () => {
        if (resendTimer === 0 && email.trim()) {
            setError('');
            setLoading(true);
            const result = await sendCode(email.trim());
            setLoading(false);

            if (result.success) {
                setResendTimer(120);
            } else {
                setError(result.error || 'Ошибка отправки кода');
            }
        }
    };

    return (
        <div className={style.authPage}>
            <SeoMeta
                title={isRegister ? 'Регистрация' : 'Вход'}
                description="Авторизация в TeamUp для доступа к профилю, проектам и откликам."
                canonicalPath="/login"
                noindex
            />
            <Header />
            <div className={style.container}>
                <div className={style.formWrapper}>
                    {step === 1 && (
                        <>
                            <h1 className={style.title}>
                                {isRegister ? 'Создать аккаунт' : 'Вход'}
                            </h1>
                            {error && <div className={style.error}>{error}</div>}
                            <form onSubmit={handleEmailSubmit} className={style.form}>
                                <label className={style.label}>
                                    Электронная почта
                                </label>
                                <input
                                    type="email"
                                    className={style.input}
                                    placeholder="ivan@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                <button 
                                    type="submit" 
                                    className={style.submitButton}
                                    disabled={loading}
                                >
                                    {loading ? 'Отправка...' : 'Продолжить'}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className={style.title}>
                                Введите код из почты
                            </h1>
                            <p className={style.description}>
                                На адрес {email} отправлен код подтверждения
                            </p>
                            {error && <div className={style.error}>{error}</div>}
                            <form onSubmit={handleCodeSubmit} className={style.form}>
                                <input
                                    type="text"
                                    className={style.input}
                                    placeholder="12345"
                                    value={code}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                                        setCode(value);
                                    }}
                                    maxLength={5}
                                    disabled={loading}
                                    required
                                />
                                <p className={style.resendText}>
                                    {resendTimer > 0 ? (
                                        <>Отправить снова через {formatTimer(resendTimer)}</>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            className={style.resendButton}
                                            disabled={loading}
                                        >
                                            Отправить снова
                                        </button>
                                    )}
                                </p>
                                <button 
                                    type="submit" 
                                    className={style.submitButton}
                                    disabled={loading}
                                >
                                    {loading ? 'Проверка...' : 'Продолжить'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
