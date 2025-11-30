import { useState, useEffect } from 'react';
import { ProjectCard } from '../projectCard/ProjectCard';
import style from './style.module.scss';

export const OpenProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Заменить на реальный API запрос
        // Пока используем моковые данные
        const mockProjects = [
            {
                id: '1',
                title: 'Mobile app project',
                description: 'Lorem ipsum dolor sit amet consecte tur adipiscing elit semper dalaracc lacus vel facilisis volutpat est velitolm.',
                tags: ['Front-end', 'Back-end', 'Designer', 'ML-developer'],
                created_at: '2025-09-19T17:55:00Z'
            },
            {
                id: '2',
                title: 'E-commerce platform',
                description: 'Разработка современной платформы для электронной коммерции с использованием React и Node.js.',
                tags: ['Front-end', 'Back-end'],
                created_at: '2025-09-18T14:30:00Z'
            },
            {
                id: '3',
                title: 'AI Chatbot',
                description: 'Создание интеллектуального чат-бота с использованием машинного обучения и NLP технологий.',
                tags: ['ML-developer', 'Back-end'],
                created_at: '2025-09-17T10:15:00Z'
            }
        ];

        // Имитация загрузки данных
        setTimeout(() => {
            setProjects(mockProjects);
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <section className={style.section}>
                <div className={style.container}>
                    <h2 className={style.title}>Открытые проекты</h2>
                    <div className={style.loading}>Загрузка...</div>
                </div>
            </section>
        );
    }

    const handleLoadMore = () => {
        // TODO: Загрузить больше проектов с API
        console.log('Загрузить еще проектов');
    };

    return (
        <section className={style.section}>
            <div className={style.container}>
                <h2 className={style.title}>Открытые проекты</h2>
                <div className={style.list}>
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
                <div className={style.loadMoreContainer}>
                    <button className={style.loadMoreButton} onClick={handleLoadMore}>
                        Загрузить еще
                    </button>
                </div>
            </div>
        </section>
    );
}

