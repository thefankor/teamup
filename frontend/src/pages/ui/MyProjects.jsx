import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../services/api';
import { ProjectCard } from '../../../components/projectCard/ProjectCard';
import style from './MyProjects.module.scss';

export default function MyProjects() {
    const { isAuthenticated } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadProjects = async (reset = false) => {
        try {
            setLoading(true);
            setError('');
            const currentOffset = reset ? 0 : offset;

            const params = {};
            if (statusFilter) {
                params.status = statusFilter;
            }
            params.limit = 20;
            params.offset = currentOffset;

            const response = await projectsAPI.myProjects(params);

            if (!response || typeof response !== 'object') {
                throw new Error('Неверный формат ответа от сервера');
            }

            const newProjects = Array.isArray(response.items) ? response.items : [];

            if (reset) {
                setProjects(newProjects);
                setOffset(20);
            } else {
                setProjects(prev => [...prev, ...newProjects]);
                setOffset(prev => prev + 20);
            }

            setHasMore(newProjects.length === 20);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : typeof err === 'string'
                    ? err
                    : JSON.stringify(err);
            setError(errorMessage || 'Ошибка загрузки проектов');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadProjects(true);
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, isAuthenticated]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadProjects(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className={style.myProjectsPage}>
                <div className={style.container}>
                    <p>Необходима авторизация</p>
                </div>
            </div>
        );
    }

    return (
        <div className={style.myProjectsPage}>
            <div className={style.container}>
                <div className={style.header}>
                    <h1 className={style.title}>Мои проекты</h1>
                    <Link to="/create_project" className={style.createButton}>
                        Создать проект
                    </Link>
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
                        className={`${style.filterButton} ${statusFilter === 'open' ? style.filterButtonActive : ''}`}
                        onClick={() => setStatusFilter('open')}
                    >
                        Открытые
                    </button>
                    <button
                        className={`${style.filterButton} ${statusFilter === 'closed' ? style.filterButtonActive : ''}`}
                        onClick={() => setStatusFilter('closed')}
                    >
                        Закрытые
                    </button>
                </div>

                {/* Список проектов */}
                {error && (
                    <div className={style.error}>
                        {typeof error === 'string' ? error : 'Произошла ошибка'}
                    </div>
                )}
                {loading && projects.length === 0 ? (
                    <div className={style.loading}>Загрузка...</div>
                ) : (
                    <>
                        <div className={style.projectsList}>
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                        {projects.length > 0 && hasMore && (
                            <div className={style.loadMoreContainer}>
                                <button
                                    className={style.loadMoreButton}
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                >
                                    {loading ? 'Загрузка...' : 'Загрузить еще'}
                                </button>
                            </div>
                        )}
                        {projects.length === 0 && !loading && (
                            <div className={style.emptyState}>
                                <p>У вас пока нет проектов</p>
                                <Link to="/create_project" className={style.createLink}>
                                    Создать первый проект
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
