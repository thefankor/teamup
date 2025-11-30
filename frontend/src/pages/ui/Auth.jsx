import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../../components/header/Header';
import style from './Auth.module.scss';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isRegister = searchParams.get('register') === 'true';
    
    const [step, setStep] = useState(1); // 1: email, 2: code, 3: profile
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [name, setName] = useState('Иван Иванов');
    const [phone, setPhone] = useState('+7 000 000 00 00');
    const [resendTimer, setResendTimer] = useState(120); // 2 минуты

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setStep(2);
            // Запускаем таймер для повторной отправки
            startResendTimer();
        }
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        if (code.trim().length === 6) {
            if (isRegister) {
                setStep(3);
            } else {
                // Вход завершен, перенаправляем
                navigate('/');
            }
        }
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        // Регистрация завершена
        navigate('/');
    };

    const startResendTimer = () => {
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResend = () => {
        if (resendTimer === 0) {
            setResendTimer(120);
            startResendTimer();
            // TODO: Отправить код повторно
        }
    };

    return (
        <div className={style.authPage}>
            <Header />
            <div className={style.container}>
                <div className={style.formWrapper}>
                    {step === 1 && (
                        <>
                            <h1 className={style.title}>
                                {isRegister ? 'Создать аккаунт' : 'Вход'}
                            </h1>
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
                                    required
                                />
                                <button type="submit" className={style.submitButton}>
                                    Продолжить
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
                                На адрес {email || 'ivan@gmail.com'} отправлено смс с кодом
                            </p>
                            <form onSubmit={handleCodeSubmit} className={style.form}>
                                <input
                                    type="text"
                                    className={style.input}
                                    placeholder="12 34 56"
                                    value={code}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setCode(value.match(/.{1,2}/g)?.join(' ') || value);
                                    }}
                                    maxLength={8}
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
                                        >
                                            Отправить снова
                                        </button>
                                    )}
                                </p>
                                <button type="submit" className={style.submitButton}>
                                    Продолжить
                                </button>
                            </form>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <h1 className={style.title}>
                                Почти готово..
                            </h1>
                            <form onSubmit={handleProfileSubmit} className={style.form}>
                                <label className={style.label}>
                                    Имя
                                </label>
                                <input
                                    type="text"
                                    className={style.input}
                                    placeholder="Иван Иванов"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <label className={style.label}>
                                    Номер телефона
                                </label>
                                <input
                                    type="tel"
                                    className={style.input}
                                    placeholder="+7 000 000 00 00"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                                <button type="submit" className={style.submitButton}>
                                    Продолжить
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
