import { useState, useEffect } from 'react';
import { ProjectCard } from '../projectCard/ProjectCard';
import { projectsAPI } from '../../src/services/api';
import style from './style.module.scss';

export const OpenProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadProjects = async (reset = false) => {
        try {
            setLoading(true);
            setError('');
            const currentOffset = reset ? 0 : offset;
            
            const response = await projectsAPI.list({
                limit: 20,
                offset: currentOffset,
            });
            const newProjects = response.items || [];

            if (reset) {
                setProjects(newProjects);
                setOffset(20);
            } else {
                setProjects(prev => [...prev, ...newProjects]);
                setOffset(prev => prev + 20);
            }

            setHasMore(newProjects.length === 20);
        } catch (err) {
            setError(err.message || 'Ошибка загрузки проектов');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects(true);
    }, []);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadProjects(false);
        }
    };

    if (loading && projects.length === 0) {
        return (
            <section className={style.section}>
                <div className={style.container}>
                    <h2 className={style.title}>Открытые проекты</h2>
                    <div className={style.loading}>Загрузка...</div>
                </div>
            </section>
        );
    }

    return (
        <section className={style.section}>
            <div className={style.container}>
                <h2 className={style.title}>Открытые проекты</h2>
                {error && <div className={style.error}>{error}</div>}
                <div className={style.list}>
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
            </div>
        </section>
    );
}

