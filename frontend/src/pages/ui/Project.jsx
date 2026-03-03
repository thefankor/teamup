import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../services/api';
import { SeoMeta } from '../../components/seo/SeoMeta';
import { ROUTES, routePaths } from '../../app/routes';
import style from './Project.module.scss';

export default function Project() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applicationsCount, setApplicationsCount] = useState(0);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadProject = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await projectsAPI.get(id);
                setProject(data);
            } catch (err) {
                setError(err.message || 'Ошибка загрузки проекта');
                console.error('Error loading project:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadProject();
        }
    }, [id]);

    // Загружаем количество заявок для владельца
    useEffect(() => {
        const loadApplicationsCount = async () => {
            if (!project || !user || !isAuthenticated) return;

            const isOwner = project.owner_id === user.id;
            if (!isOwner) return;

            try {
                const response = await projectsAPI.listApplications(id, {
                    status_filter: 'pending',
                    limit: 100, // Получаем все pending заявки для подсчета
                });
                setApplicationsCount(response.items?.length || 0);
            } catch (err) {
                console.error('Error loading applications count:', err);
            }
        };

        loadApplicationsCount();
    }, [project, user, isAuthenticated, id]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTagColor = (tag) => {
        const colors = {
            'Front-end': '#d1fae5',
            'Back-end': '#dbeafe',
            'Designer': '#e9d5ff',
            'ML-developer': '#fef3c7',
        };
        return colors[tag] || '#f3f4f6';
    };

    const handlePositionToggle = (positionId) => {
        setSelectedPositions(prev =>
            prev.includes(positionId)
                ? prev.filter(id => id !== positionId)
                : [...prev, positionId]
        );
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate(ROUTES.login);
            return;
        }

        if (selectedPositions.length === 0) {
            alert('Выберите хотя бы одну позицию');
            return;
        }

        try {
            setSubmitting(true);
            await projectsAPI.submitApplication(id, {
                position_ids: selectedPositions,
                message: message || null,
            });
            setShowApplicationModal(false);
            setShowSuccessModal(true);
            setSelectedPositions([]);
            setMessage('');

            // Перезагружаем проект, чтобы обновить статус
            const data = await projectsAPI.get(id);
            setProject(data);
        } catch (err) {
            alert(err.message || 'Ошибка отправки заявки');
            console.error('Error submitting application:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
    };

    if (loading) {
        return (
            <div className={style.projectPage}>
                <SeoMeta title="Загрузка проекта" canonicalPath={`/projects/${id || ''}`} noindex />
                <div className={style.container}>
                    <div className={style.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className={style.projectPage}>
                <SeoMeta title="Проект не найден" canonicalPath={`/projects/${id || ''}`} noindex />
                <div className={style.container}>
                    <div className={style.error}>{error || 'Проект не найден'}</div>
                </div>
            </div>
        );
    }

    // Преобразуем данные проекта для отображения
    const openPositions = project.positions?.filter(pos => pos.is_open) || [];
    const team = project.team || [];

    // Проверяем, является ли пользователь владельцем
    const isOwner = isAuthenticated && user && project.owner_id === user.id;

    // Проверяем, является ли пользователь участником
    const isTeamMember = isAuthenticated && user && team.some(member => member.user_id === user.id);

    // Показываем кнопку "Откликнуться" только если:
    // - проект открыт
    // - пользователь авторизован
    // - пользователь НЕ владелец
    // - пользователь НЕ участник
    const canApply = project.status === 'open' && isAuthenticated && !isOwner && !isTeamMember;

    return (
        <div className={style.projectPage}>
            <SeoMeta
                title={project.title}
                description={(project.description || 'Открытый проект на платформе TeamUp').slice(0, 160)}
                canonicalPath={routePaths.projectDetails(id)}
                ogType="article"
            />
            <div className={style.container}>
                {/* Информация о проекте */}
                <div className={style.projectCard}>
                    <div className={style.projectHeader}>
                        <div className={style.projectTitleSection}>
                            <h1 className={style.projectTitle}>{project.title}</h1>
                            <div className={style.tags}>
                                {project.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className={style.tag}
                                        style={{ backgroundColor: getTagColor(tag) }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <span className={style.projectDate}>
                            {formatDate(project.created_at)}
                        </span>
                    </div>
                    <p className={style.projectDescription}>{project.description || 'Описание отсутствует'}</p>
                    {isOwner ? (
                        <button
                            className={style.viewApplicationsButton}
                            onClick={() => navigate(routePaths.projectResponses(id))}
                        >
                            Посмотреть заявки
                            {applicationsCount > 0 && (
                                <span className={style.badge}>{applicationsCount}</span>
                            )}
                        </button>
                    ) : canApply ? (
                        <button
                            className={style.applyButton}
                            onClick={() => setShowApplicationModal(true)}
                        >
                            Откликнуться
                        </button>
                    ) : null}
                </div>

                {/* Команда */}
                {team.length > 0 && (
                    <div className={style.section}>
                        <h2 className={style.sectionTitle}>Уже в нашей команде</h2>
                        <div className={style.teamGrid}>
                            {team.map((member) => (
                                <div key={member.user_id} className={style.teamCard}>
                                    {member.avatar_url ? (
                                        <img
                                            src={member.avatar_url}
                                            alt={`Аватар участника: ${member.full_name}`}
                                            className={style.teamAvatar}
                                            width="64"
                                            height="64"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className={style.teamAvatarPlaceholder}>
                                            {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                    )}
                                    <div className={style.teamInfo}>
                                        <h3 className={style.teamName}>
                                            {(user?.user_type || '').toLowerCase() === 'admin' ? (
                                                <Link to={routePaths.userProfile(member.user_id)} className={style.teamMemberLink}>
                                                    {member.full_name}
                                                </Link>
                                            ) : (
                                                member.full_name
                                            )}
                                            {(member.user_type || '').toLowerCase() === 'admin' && (
                                                <span className={style.adminBadge} title="Администратор">✓ Админ</span>
                                            )}
                                        </h3>
                                        <p className={style.teamRole}>{member.roles?.join(', ') || 'Участник'}</p>
                                        {(user?.user_type || '').toLowerCase() === 'admin' && (
                                            <Link to={routePaths.userProfile(member.user_id)} className={style.changeTypeLink}>
                                                Сменить тип
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Открытые позиции */}
                {openPositions.length > 0 && (
                    <div className={style.section}>
                        <h2 className={style.sectionTitle}>В активном поиске</h2>
                        <div className={style.positionsGrid}>
                            {openPositions.map((position) => (
                                <div key={position.id} className={style.positionCard}>
                                    <svg className={style.searchIcon} width="24" height="24" viewBox="0 0 20 20" fill="none">
                                        <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className={style.positionInfo}>
                                        <h3 className={style.positionRole}>{position.role}</h3>
                                        <p className={style.positionLevel}>{position.level?.toUpperCase() || 'ANY'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Форма отклика */}
                {openPositions.length > 0 && canApply && (
                    <div className={style.section}>
                        <h2 className={style.sectionTitle}>Отправить заявку</h2>
                        <form onSubmit={handleSubmitApplication} className={style.applicationForm}>
                            <p className={style.formInstruction}>
                                Выберите одну или несколько позиций
                            </p>
                            <div className={style.positionTags}>
                                {openPositions.map((position) => (
                                    <button
                                        key={position.id}
                                        type="button"
                                        className={`${style.positionTag} ${selectedPositions.includes(position.id) ? style.positionTagActive : ''}`}
                                        onClick={() => handlePositionToggle(position.id)}
                                        style={{
                                            backgroundColor: selectedPositions.includes(position.id)
                                                ? getTagColor(position.role.split(' ')[0])
                                                : '#f3f4f6'
                                        }}
                                    >
                                        {position.role}
                                    </button>
                                ))}
                            </div>
                            <label className={style.formLabel}>Сообщение</label>
                            <textarea
                                className={style.messageInput}
                                placeholder="Please type your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                            />
                            <button
                                type="submit"
                                className={style.submitButton}
                                disabled={submitting}
                            >
                                {submitting ? 'Отправка...' : 'Откликнуться'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Модальное окно отправки заявки */}
            {showApplicationModal && (
                <div className={style.modalOverlay} onClick={() => setShowApplicationModal(false)}>
                    <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={style.modalHeader}>
                            <h2 className={style.modalTitle}>Отправить заявку</h2>
                            <button
                                className={style.modalClose}
                                onClick={() => setShowApplicationModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitApplication} className={style.modalForm}>
                            <p className={style.formInstruction}>
                                Выберите одну или несколько позиций
                            </p>
                            <div className={style.positionTags}>
                                {openPositions.map((position) => (
                                    <button
                                        key={position.id}
                                        type="button"
                                        className={`${style.positionTag} ${selectedPositions.includes(position.id) ? style.positionTagActive : ''}`}
                                        onClick={() => handlePositionToggle(position.id)}
                                        style={{
                                            backgroundColor: selectedPositions.includes(position.id)
                                                ? getTagColor(position.role.split(' ')[0])
                                                : '#f3f4f6'
                                        }}
                                    >
                                        {position.role}
                                    </button>
                                ))}
                            </div>
                            <label className={style.formLabel}>Сообщение</label>
                            <textarea
                                className={style.messageInput}
                                placeholder="Please type your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                            />
                            <div className={style.modalFooter}>
                                <button
                                    type="button"
                                    className={style.modalCancelButton}
                                    onClick={() => setShowApplicationModal(false)}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className={style.modalSubmitButton}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Отправка...' : 'Откликнуться'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно успешной отправки */}
            {showSuccessModal && (
                <div className={style.modalOverlay} onClick={handleCloseSuccess}>
                    <div className={style.successModal} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={style.modalClose}
                            onClick={handleCloseSuccess}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        <div className={style.successIcon}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="24" fill="#3b82f6" opacity="0.1" />
                                <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="2" />
                                <path d="M16 24L22 30L32 18" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className={style.successTitle}>Заявка успешно отправлена</h2>
                        <button
                            className={style.successButton}
                            onClick={handleCloseSuccess}
                        >
                            Продолжить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
