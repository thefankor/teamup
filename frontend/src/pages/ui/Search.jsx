import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectCard } from '../../../components/projectCard/ProjectCard';
import { projectsAPI } from '../../services/api';
import style from './Search.module.scss';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [showPositionDropdown, setShowPositionDropdown] = useState(false);
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);

    const positions = ['Front-end', 'Back-end', 'Designer', 'ML-developer'];
    const levels = ['JUNIOR', 'MIDDLE', 'SENIOR'];

    const loadProjects = async (reset = false) => {
        try {
            setLoading(true);
            setError('');
            const currentOffset = reset ? 0 : offset;

            const params = {
                q: query || undefined,
                role: selectedPosition || undefined,
                level: selectedLevel || undefined,
                limit: 20,
                offset: currentOffset,
            };

            const response = await projectsAPI.list(params);
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
    }, [query, selectedPosition, selectedLevel]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadProjects(false);
        }
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
                                className={`${style.filterButton} ${selectedPosition ? style.filterButtonActive : ''}`}
                                onClick={() => {
                                    setShowPositionDropdown(!showPositionDropdown);
                                    setShowLevelDropdown(false);
                                }}
                            >
                                Позиция{selectedPosition && `: ${selectedPosition}`}
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                                className={`${style.filterButton} ${selectedLevel ? style.filterButtonActive : ''}`}
                                onClick={() => {
                                    setShowLevelDropdown(!showLevelDropdown);
                                    setShowPositionDropdown(false);
                                }}
                            >
                                Уровень{selectedLevel && `: ${selectedLevel}`}
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

                    {/* Активные фильтры */}
                    {(selectedPosition || selectedLevel) && (
                        <div className={style.activeFilters}>
                            <span className={style.activeFiltersLabel}>Активные фильтры:</span>
                            {selectedPosition && (
                                <span className={style.activeFilterTag}>
                                    Позиция: {selectedPosition}
                                    <button
                                        className={style.removeFilterButton}
                                        onClick={() => setSelectedPosition(null)}
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {selectedLevel && (
                                <span className={style.activeFilterTag}>
                                    Уровень: {selectedLevel}
                                    <button
                                        className={style.removeFilterButton}
                                        onClick={() => setSelectedLevel(null)}
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Список проектов */}
                {error && (
                    <div className={style.error}>{error}</div>
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
                                <p>Проекты не найдены</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
