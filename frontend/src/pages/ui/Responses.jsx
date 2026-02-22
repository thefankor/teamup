import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, userAPI } from '../../services/api';
import style from './Responses.module.scss';

export default function Responses() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [project, setProject] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [applicantProfiles, setApplicantProfiles] = useState({});
    const [processingId, setProcessingId] = useState(null);
    const [decisionNote, setDecisionNote] = useState('');
    const [showDecisionModal, setShowDecisionModal] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!isAuthenticated || !id) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                setError('');

                // Загружаем проект для проверки владельца
                const projectData = await projectsAPI.get(id);
                setProject(projectData);

                // Проверяем, является ли пользователь владельцем
                if (projectData.owner_id !== user.id) {
                    setError('У вас нет доступа к заявкам этого проекта');
                    setLoading(false);
                    return;
                }

                // Загружаем заявки
                await loadApplications();
            } catch (err) {
                setError(err.message || 'Ошибка загрузки данных');
                console.error('Error loading data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, isAuthenticated, user]);

    const loadApplications = async () => {
        try {
            const response = await projectsAPI.listApplications(id, {
                status_filter: statusFilter || undefined,
                limit: 100,
            });

            const apps = response.items || [];
            setApplications(apps);

            // Загружаем профили заявителей
            // TODO: Добавить эндпоинт для получения профиля по ID
            // Пока оставляем пустым, будет показываться ID
            setApplicantProfiles({});
        } catch (err) {
            setError(err.message || 'Ошибка загрузки заявок');
            console.error('Error loading applications:', err);
        }
    };

    useEffect(() => {
        if (project && project.owner_id === user?.id) {
            loadApplications();
        }
    }, [statusFilter, project]);

    const handleDecision = async (applicationId, approve) => {
        try {
            setProcessingId(applicationId);
            await projectsAPI.decideApplication(id, applicationId, {
                approve,
                note: decisionNote || null,
            });

            setDecisionNote('');
            setShowDecisionModal(null);
            await loadApplications();

            // Обновляем проект, чтобы обновить количество заявок
            const projectData = await projectsAPI.get(id);
            setProject(projectData);
        } catch (err) {
            alert(err.message || 'Ошибка обработки заявки');
            console.error('Error deciding application:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Ожидает решения',
            approved: 'Одобрена',
            rejected: 'Отклонена',
            withdrawn: 'Отозвана',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            approved: '#10b981',
            rejected: '#ef4444',
            withdrawn: '#6b7280',
        };
        return colors[status] || '#6b7280';
    };

    if (loading) {
        return (
            <div className={style.responsesPage}>
                <div className={style.container}>
                    <div className={style.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className={style.responsesPage}>
                <div className={style.container}>
                    <div className={style.error}>{error}</div>
                </div>
            </div>
        );
    }

    if (!project || project.owner_id !== user?.id) {
        return (
            <div className={style.responsesPage}>
                <div className={style.container}>
                    <div className={style.error}>У вас нет доступа к заявкам этого проекта</div>
                </div>
            </div>
        );
    }

    return (
        <div className={style.responsesPage}>
            <div className={style.container}>
                <div className={style.header}>
                    <Link to={`/project/${id}`} className={style.backLink}>
                        ← Назад к проекту
                    </Link>
                    <h1 className={style.title}>Заявки на проект: {project.title}</h1>
                </div>

                {/* Фильтры */}
                <div className={style.filters}>
                    <button
                        className={`${style.filterButton} ${statusFilter === null ? style.filterButtonActive : ''}`}
                        onClick={() => setStatusFilter(null)}
                    >
                        Все
                    </button>
                    <button
                        className={`${style.filterButton} ${statusFilter === 'pending' ? style.filterButtonActive : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Ожидают решения
                    </button>
                    <button
                        className={`${style.filterButton} ${statusFilter === 'approved' ? style.filterButtonActive : ''}`}
                        onClick={() => setStatusFilter('approved')}
                    >
                        Одобренные
                    </button>
                    <button
                        className={`${style.filterButton} ${statusFilter === 'rejected' ? style.filterButtonActive : ''}`}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Отклоненные
                    </button>
                </div>

                {error && <div className={style.error}>{error}</div>}

                {/* Список заявок */}
                {applications.length === 0 ? (
                    <div className={style.emptyState}>
                        <p>Заявки не найдены</p>
                    </div>
                ) : (
                    <div className={style.applicationsList}>
                        {applications.map((application) => (
                            <div key={application.id} className={style.applicationCard}>
                                <div className={style.applicationHeader}>
                                    <div className={style.applicantInfo}>
                                        <div className={style.applicantAvatar}>
                                            {applicantProfiles[application.applicant_id]?.avatar_url ? (
                                                <img
                                                    src={applicantProfiles[application.applicant_id].avatar_url}
                                                    alt="Avatar"
                                                />
                                            ) : (
                                                <div className={style.avatarPlaceholder}>
                                                    {application.applicant_id.toString().slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className={style.applicantDetails}>
                                            <h3 className={style.applicantName}>
                                                {applicantProfiles[application.applicant_id]?.first_name && applicantProfiles[application.applicant_id]?.last_name
                                                    ? `${applicantProfiles[application.applicant_id].first_name} ${applicantProfiles[application.applicant_id].last_name}`
                                                    : `Пользователь ${application.applicant_id.toString().slice(0, 8)}`
                                                }
                                            </h3>
                                            <p className={style.applicationDate}>
                                                {formatDate(application.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={style.statusBadge}
                                        style={{ backgroundColor: getStatusColor(application.status) + '20', color: getStatusColor(application.status) }}
                                    >
                                        {getStatusLabel(application.status)}
                                    </div>
                                </div>

                                {application.message && (
                                    <div className={style.message}>
                                        <p className={style.messageLabel}>Сообщение:</p>
                                        <p className={style.messageText}>{application.message}</p>
                                    </div>
                                )}

                                <div className={style.positions}>
                                    <p className={style.positionsLabel}>Позиции:</p>
                                    <div className={style.positionTags}>
                                        {application.position_ids.map((positionId) => {
                                            const position = project.positions?.find(p =>
                                                p.id === positionId || p.id.toString() === positionId.toString()
                                            );
                                            return (
                                                <span key={positionId} className={style.positionTag}>
                                                    {position?.role || `Позиция ${typeof positionId === 'string' ? positionId.slice(0, 8) : positionId}`}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {application.status === 'pending' && (
                                    <div className={style.actions}>
                                        <button
                                            className={style.rejectButton}
                                            onClick={() => setShowDecisionModal(application.id)}
                                            disabled={processingId === application.id}
                                        >
                                            Отклонить
                                        </button>
                                        <button
                                            className={style.approveButton}
                                            onClick={() => setShowDecisionModal(application.id)}
                                            disabled={processingId === application.id}
                                        >
                                            Одобрить
                                        </button>
                                    </div>
                                )}

                                {application.decided_at && (
                                    <p className={style.decidedDate}>
                                        Решение принято: {formatDate(application.decided_at)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модальное окно решения */}
            {showDecisionModal && (
                <div className={style.modalOverlay} onClick={() => {
                    setShowDecisionModal(null);
                    setDecisionNote('');
                }}>
                    <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={style.modalHeader}>
                            <h2 className={style.modalTitle}>Принять решение</h2>
                            <button
                                className={style.modalClose}
                                onClick={() => {
                                    setShowDecisionModal(null);
                                    setDecisionNote('');
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <div className={style.modalBody}>
                            <label className={style.modalLabel}>Комментарий (необязательно)</label>
                            <textarea
                                className={style.modalTextarea}
                                value={decisionNote}
                                onChange={(e) => setDecisionNote(e.target.value)}
                                placeholder="Добавьте комментарий к решению..."
                                rows={4}
                            />
                        </div>
                        <div className={style.modalFooter}>
                            <button
                                className={style.modalCancelButton}
                                onClick={() => {
                                    setShowDecisionModal(null);
                                    setDecisionNote('');
                                }}
                            >
                                Отмена
                            </button>
                            <button
                                className={style.modalRejectButton}
                                onClick={() => handleDecision(showDecisionModal, false)}
                                disabled={processingId === showDecisionModal}
                            >
                                {processingId === showDecisionModal ? 'Обработка...' : 'Отклонить'}
                            </button>
                            <button
                                className={style.modalApproveButton}
                                onClick={() => handleDecision(showDecisionModal, true)}
                                disabled={processingId === showDecisionModal}
                            >
                                {processingId === showDecisionModal ? 'Обработка...' : 'Одобрить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
