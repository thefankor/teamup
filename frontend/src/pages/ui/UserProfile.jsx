import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import { SeoMeta } from '../../components/seo/SeoMeta';
import { ROUTES, routePaths } from '../../app/routes';
import style from './Profile.module.scss';

export default function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noAccess, setNoAccess] = useState(false);
    const [error, setError] = useState('');
    const [changingType, setChangingType] = useState(false);
    const [selectedUserType, setSelectedUserType] = useState('USER');

    useEffect(() => {
        if (!isAuthenticated && !authLoading) {
            navigate(ROUTES.login);
            return;
        }
    }, [isAuthenticated, authLoading, navigate]);

    useEffect(() => {
        if (!userId || !currentUser) {
            if (currentUser && userId) setLoading(false);
            return;
        }
        if (userId === currentUser.id) {
            navigate(ROUTES.profile, { replace: true });
            return;
        }
        const load = async () => {
            setLoading(true);
            setNoAccess(false);
            try {
                const data = await userAPI.getProfileById(userId);
                setProfile(data);
                setSelectedUserType((data.user_type || 'USER').toUpperCase());
            } catch (err) {
                if (err.status === 403) {
                    setNoAccess(true);
                } else {
                    setError(err.message || 'Ошибка загрузки');
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId, currentUser, navigate]);

    const handleSetUserType = async () => {
        if (!isAdmin || !userId) return;
        setError('');
        setChangingType(true);
        try {
            const updated = await userAPI.setUserType(userId, selectedUserType);
            setProfile(updated);
        } catch (err) {
            setError(err.message || 'Ошибка смены типа');
        } finally {
            setChangingType(false);
        }
    };

    if (authLoading || (loading && !noAccess && !profile)) {
        return (
            <div className={style.profilePage}>
                <div className={style.container}>Загрузка...</div>
            </div>
        );
    }

    if (noAccess) {
        return (
            <div className={style.profilePage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <SeoMeta
                    title="Профиль пользователя"
                    description="Просмотр профиля пользователя."
                    canonicalPath={routePaths.userProfile(userId)}
                    noindex
                />
                <div className={style.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '480px' }}>
                    <div className={style.card} style={{ textAlign: 'center', padding: '48px 24px', width: '100%' }}>
                        <h2 className={style.name} style={{ marginBottom: '16px' }}>У вас нет доступа к этой странице</h2>
                        <p className={style.description}>Просматривать чужие профили могут только администраторы.</p>
                        <Link to={ROUTES.home} className={style.modalSaveButton} style={{ display: 'inline-block', marginTop: '24px', textDecoration: 'none' }}>
                            На главную
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className={style.profilePage}>
                <div className={style.container}>
                    <div className={style.error}>{error}</div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const p = {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        position: profile.position || '',
        tags: profile.tags || [],
        about: profile.about || '',
        skills: profile.skills || [],
        contacts: profile.contact_info || {},
        education: (profile.education || []).map(edu => ({
            id: edu.id,
            university: edu.university,
            specialty: edu.specialty,
            degree: edu.degree,
            year: String(edu.graduation_year),
        })),
        userType: (profile.user_type || 'user').toLowerCase(),
    };

    return (
        <div className={style.profilePage}>
            <SeoMeta
                title={`Профиль: ${p.firstName} ${p.lastName}`.trim()}
                description="Публичный просмотр пользовательского профиля (доступ только для администраторов)."
                canonicalPath={routePaths.userProfile(userId)}
                noindex
            />
            <div className={style.container}>
                {error && <div className={style.error}>{error}</div>}

                {/* Админ-блок: смена типа */}
                {isAdmin && (
                    <div className={style.card} style={{ marginBottom: '24px' }}>
                        <h2 className={style.sectionTitle}>Тип пользователя (только для администратора)</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <label>
                                <span style={{ marginRight: '8px' }}>Тип:</span>
                                <select
                                    value={selectedUserType}
                                    onChange={(e) => setSelectedUserType(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                >
                                    <option value="USER">Пользователь</option>
                                    <option value="ADMIN">Администратор</option>
                                </select>
                            </label>
                            <button
                                type="button"
                                className={style.modalSaveButton}
                                onClick={handleSetUserType}
                                disabled={changingType || (selectedUserType || '').toUpperCase() === (profile?.user_type || '').toUpperCase()}
                            >
                                {changingType ? 'Сохранение...' : 'Сменить тип'}
                            </button>
                            {(p.userType || '').toLowerCase() === 'admin' && (
                                <span className={style.tag} style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                    ✓
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Основная информация (только просмотр) */}
                <div className={style.card}>
                    <div className={style.profileHeader}>
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={`Аватар пользователя ${p.firstName} ${p.lastName}`.trim()}
                                className={style.avatar}
                                width="120"
                                height="120"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div className={style.avatarPlaceholder}>
                                {p.firstName && p.lastName
                                    ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase()
                                    : p.firstName ? p.firstName[0].toUpperCase() : 'U'}
                            </div>
                        )}
                        <div className={style.profileInfo}>
                            <h1 className={style.name}>
                                {p.firstName} {p.lastName}
                                {(p.userType || '').toLowerCase() === 'admin' && (
                                    <span className={style.tag} style={{ marginLeft: '12px', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '14px' }}>
                                        ✓ Админ
                                    </span>
                                )}
                            </h1>
                            <p className={style.role}>{p.position}</p>
                            <div className={style.tags}>
                                {(p.tags || []).map((tag, i) => (
                                    <span key={i} className={style.tag} style={{ backgroundColor: '#f3f4f6' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={style.card}>
                    <h2 className={style.sectionTitle}>О себе</h2>
                    <p className={style.description}>{p.about || '—'}</p>
                    <h3 className={style.subtitle}>Навыки</h3>
                    <div className={style.skillsList}>
                        {(p.skills || []).map((skill, i) => (
                            <span key={i} className={style.skillTag}>{skill}</span>
                        ))}
                    </div>
                </div>

                <div className={style.card}>
                    <h2 className={style.sectionTitle}>Контактная информация</h2>
                    <div className={style.contactsGrid}>
                        <div className={style.contactItem}>
                            <span className={style.contactValue}>{p.contacts.phone || '—'}</span>
                        </div>
                        <div className={style.contactItem}>
                            <span className={style.contactValue}>{p.contacts.email || '—'}</span>
                        </div>
                    </div>
                </div>

                <div className={style.card}>
                    <h2 className={style.sectionTitle}>Образование</h2>
                    {!p.education.length ? (
                        <p className={style.emptyText}>Не указано</p>
                    ) : (
                        p.education.map((edu) => (
                            <div key={edu.id} className={style.educationItem}>
                                <h3 className={style.educationTitle}>{edu.university}</h3>
                                <p className={style.educationSpecialty}>{edu.specialty}</p>
                                <p className={style.educationDegree}>{edu.degree}, {edu.year}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
