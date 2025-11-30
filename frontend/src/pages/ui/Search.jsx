import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectCard } from '../../../components/projectCard/ProjectCard';
import style from './Search.module.scss';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [showPositionDropdown, setShowPositionDropdown] = useState(false);
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);

    const positions = ['Front-end', 'Back-end', 'Designer', 'ML-developer'];
    const levels = ['JUNIOR', 'MIDDLE', 'SENIOR'];

    useEffect(() => {
        // TODO: Заменить на реальный API запрос с фильтрами
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
                title: 'Mobile e-commerce platform',
                description: 'Разработка современной платформы для электронной коммерции с использованием React и Node.js.',
                tags: ['Front-end', 'Back-end'],
                created_at: '2025-09-18T14:30:00Z'
            },
            {
                id: '3',
                title: 'Mobile AI Chatbot',
                description: 'Создание интеллектуального чат-бота с использованием машинного обучения и NLP технологий.',
                tags: ['ML-developer', 'Back-end'],
                created_at: '2025-09-17T10:15:00Z'
            }
        ];

        // Имитация загрузки данных
        setLoading(true);
        setTimeout(() => {
            // Фильтруем по запросу (если есть)
            const filtered = query 
                ? mockProjects.filter(p => 
                    p.title.toLowerCase().includes(query.toLowerCase()) ||
                    p.description.toLowerCase().includes(query.toLowerCase())
                )
                : mockProjects;
            
            setProjects(filtered);
            setLoading(false);
        }, 500);
    }, [query, selectedPosition, selectedLevel]);

    const handleLoadMore = () => {
        // TODO: Загрузить больше проектов с API
        console.log('Загрузить еще проектов');
    };

    return (
        <div className={style.searchPage}>
            <div className={style.container}>
                <h1 className={style.title}>
                    Открытые проекты по запросу: {query || 'все проекты'}
                </h1>

                {/* Фильтры */}
                <div className={style.filtersSection}>
                    <h2 className={style.filtersTitle}>Фильтры</h2>
                    <div className={style.filters}>
                        <div className={style.filterWrapper}>
                            <button
                                className={style.filterButton}
                                onClick={() => {
                                    setShowPositionDropdown(!showPositionDropdown);
                                    setShowLevelDropdown(false);
                                }}
                            >
                                Позиция
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            {showPositionDropdown && (
                                <div className={style.dropdown}>
                                    <button
                                        className={`${style.dropdownItem} ${selectedPosition === null ? style.dropdownItemActive : ''}`}
                                        onClick={() => {
                                            setSelectedPosition(null);
                                            setShowPositionDropdown(false);
                                        }}
                                    >
                                        Все позиции
                                    </button>
                                    {positions.map((position) => (
                                        <button
                                            key={position}
                                            className={`${style.dropdownItem} ${selectedPosition === position ? style.dropdownItemActive : ''}`}
                                            onClick={() => {
                                                setSelectedPosition(position);
                                                setShowPositionDropdown(false);
                                            }}
                                        >
                                            {position}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={style.filterWrapper}>
                            <button
                                className={style.filterButton}
                                onClick={() => {
                                    setShowLevelDropdown(!showLevelDropdown);
                                    setShowPositionDropdown(false);
                                }}
                            >
                                Уровень
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            {showLevelDropdown && (
                                <div className={style.dropdown}>
                                    <button
                                        className={`${style.dropdownItem} ${selectedLevel === null ? style.dropdownItemActive : ''}`}
                                        onClick={() => {
                                            setSelectedLevel(null);
                                            setShowLevelDropdown(false);
                                        }}
                                    >
                                        Все уровни
                                    </button>
                                    {levels.map((level) => (
                                        <button
                                            key={level}
                                            className={`${style.dropdownItem} ${selectedLevel === level ? style.dropdownItemActive : ''}`}
                                            onClick={() => {
                                                setSelectedLevel(level);
                                                setShowLevelDropdown(false);
                                            }}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Список проектов */}
                {loading ? (
                    <div className={style.loading}>Загрузка...</div>
                ) : (
                    <>
                        <div className={style.projectsList}>
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                        {projects.length > 0 && (
                            <div className={style.loadMoreContainer}>
                                <button className={style.loadMoreButton} onClick={handleLoadMore}>
                                    Загрузить еще
                                </button>
                            </div>
                        )}
                        {projects.length === 0 && (
                            <div className={style.emptyState}>
                                <p>Проекты не найдены</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
