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
    const [total, setTotal] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedSort, setSelectedSort] = useState('created_desc');
    const [showPositionDropdown, setShowPositionDropdown] = useState(false);
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const positions = ['Front-end', 'Back-end', 'Designer', 'ML-developer'];
    const levels = ['JUNIOR', 'MIDDLE', 'SENIOR'];
    const sortOptions = [
        { value: 'created_desc', label: 'Сначала новые', sort_by: 'created_at', order: 'desc' },
        { value: 'created_asc', label: 'Сначала старые', sort_by: 'created_at', order: 'asc' },
        { value: 'positions_desc', label: 'Больше открытых позиций', sort_by: 'open_positions', order: 'desc' },
        { value: 'positions_asc', label: 'Меньше открытых позиций', sort_by: 'open_positions', order: 'asc' },
    ];
    const currentSort = sortOptions.find((option) => option.value === selectedSort) || sortOptions[0];
    const totalPages = total !== null ? Math.max(1, Math.ceil(total / pageSize)) : null;

    const loadProjects = async () => {
        try {
            setLoading(true);
            setError('');
            const currentOffset = (currentPage - 1) * pageSize;

            const params = {
                q: query || undefined,
                role: selectedPosition || undefined,
                level: selectedLevel || undefined,
                sort_by: currentSort.sort_by,
                order: currentSort.order,
                limit: pageSize,
                offset: currentOffset,
            };

            const response = await projectsAPI.list(params);
            const items = response.items || [];
            setProjects(items);
            setTotal(typeof response.total === 'number' ? response.total : null);
            setHasNextPage(items.length === pageSize);
        } catch (err) {
            setError(err.message || 'Ошибка загрузки проектов');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [query, selectedPosition, selectedLevel, selectedSort, pageSize]);

    useEffect(() => {
        loadProjects();
    }, [query, selectedPosition, selectedLevel, selectedSort, currentPage, pageSize]);

    useEffect(() => {
        if (typeof totalPages === 'number' && totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [total, totalPages, currentPage]);

    const buildPageNumbers = () => {
        if (totalPages === null) {
            const pages = [];
            if (currentPage > 1) {
                pages.push(currentPage - 1);
            }
            pages.push(currentPage);
            if (hasNextPage) {
                pages.push(currentPage + 1);
            }
            return pages;
        }

        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
        }

        if (currentPage >= totalPages - 3) {
            return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages];
    };

    const pageNumbers = buildPageNumbers();
    const showPagination = projects.length > 0 && (
        totalPages !== null ? totalPages > 1 : (currentPage > 1 || hasNextPage)
    );

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
                                    setShowSortDropdown(false);
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
                                    setShowSortDropdown(false);
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

                        <div className={style.filterWrapper}>
                            <button
                                className={`${style.filterButton} ${selectedSort !== 'created_desc' ? style.filterButtonActive : ''}`}
                                onClick={() => {
                                    setShowSortDropdown(!showSortDropdown);
                                    setShowPositionDropdown(false);
                                    setShowLevelDropdown(false);
                                }}
                            >
                                Сортировка: {currentSort.label}
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {showSortDropdown && (
                                <div className={style.dropdown}>
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`${style.dropdownItem} ${selectedSort === option.value ? style.dropdownItemActive : ''}`}
                                            onClick={() => {
                                                setSelectedSort(option.value);
                                                setShowSortDropdown(false);
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Активные фильтры */}
                    {(selectedPosition || selectedLevel || selectedSort !== 'created_desc') && (
                        <div className={style.activeFilters}>
                            <span className={style.activeFiltersLabel}>Активные фильтры:</span>
                            {selectedPosition && (
                                <span className={style.activeFilterTag}>
                                    Позиция: {selectedPosition}
                                    <button
                                        className={style.removeFilterButton}
                                        onClick={() => {
                                            setSelectedPosition(null);
                                            setShowPositionDropdown(false);
                                        }}
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
                                        onClick={() => {
                                            setSelectedLevel(null);
                                            setShowLevelDropdown(false);
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {selectedSort !== 'created_desc' && (
                                <span className={style.activeFilterTag}>
                                    Сортировка: {currentSort.label}
                                    <button
                                        className={style.removeFilterButton}
                                        onClick={() => {
                                            setSelectedSort('created_desc');
                                            setShowSortDropdown(false);
                                        }}
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
                        <div className={style.resultsToolbar}>
                            <label className={style.pageSizeControl}>
                                Показывать по
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className={style.pageSizeSelect}
                                >
                                    {[5, 10, 20].map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className={style.projectsList}>
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                        {showPagination && (
                            <div className={style.pagination}>
                                <button
                                    className={style.paginationButton}
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={loading || currentPage === 1}
                                >
                                    Назад
                                </button>

                                <div className={style.paginationNumbers}>
                                    {pageNumbers.map((page, index) => (
                                        typeof page === 'number' ? (
                                            <button
                                                key={page}
                                                className={`${style.paginationButton} ${currentPage === page ? style.paginationButtonActive : ''}`}
                                                onClick={() => setCurrentPage(page)}
                                                disabled={loading}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span key={`${page}-${index}`} className={style.paginationEllipsis}>…</span>
                                        )
                                    ))}
                                </div>

                                <button
                                    className={style.paginationButton}
                                    onClick={() => setCurrentPage((prev) => (
                                        totalPages !== null ? Math.min(totalPages, prev + 1) : prev + 1
                                    ))}
                                    disabled={loading || (totalPages !== null ? currentPage === totalPages : !hasNextPage)}
                                >
                                    Вперед
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
