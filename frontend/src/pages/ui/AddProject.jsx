import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../services/api';
import { SeoMeta } from '../../components/seo/SeoMeta';
import { ROUTES, routePaths } from '../../app/routes';
import style from './AddProject.module.scss';

export default function AddProject() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: [],
        positions: [{ role: '', level: 'junior', tags: [] }],
    });

    const availableTags = ['Front-end', 'Back-end', 'Designer', 'ML-developer'];
    const levels = [
        { value: 'junior', label: 'Junior' },
        { value: 'middle', label: 'Middle' },
        { value: 'senior', label: 'Senior' },
    ];

    const handleTagToggle = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const handlePositionChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            positions: prev.positions.map((pos, i) => 
                i === index ? { ...pos, [field]: value } : pos
            )
        }));
    };

    const addPosition = () => {
        setFormData(prev => ({
            ...prev,
            positions: [...prev.positions, { role: '', level: 'junior', tags: [] }]
        }));
    };

    const removePosition = (index) => {
        setFormData(prev => ({
            ...prev,
            positions: prev.positions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            navigate(ROUTES.login);
            return;
        }

        if (!formData.title.trim()) {
            setError('Введите название проекта');
            return;
        }

        if (formData.positions.some(pos => !pos.role.trim())) {
            setError('Заполните все позиции');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const projectData = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                tags: formData.tags,
                positions: formData.positions.map(pos => ({
                    role: pos.role.trim(),
                    level: pos.level,
                    tags: pos.tags || [],
                })),
            };

            const project = await projectsAPI.create(projectData);
            navigate(routePaths.projectDetails(project.id));
        } catch (err) {
            setError(err.message || 'Ошибка создания проекта');
            console.error('Error creating project:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className={style.addProjectPage}>
                <div className={style.container}>
                    <p>Необходима авторизация</p>
                </div>
            </div>
        );
    }

    return (
        <div className={style.addProjectPage}>
            <SeoMeta
                title="Создать проект"
                description="Создание нового проекта и позиций для поиска участников."
                canonicalPath={ROUTES.createProject}
                noindex
            />
            <div className={style.container}>
                <h1 className={style.title}>Создать проект</h1>
                
                {error && <div className={style.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} className={style.form}>
                    <div className={style.formGroup}>
                        <label className={style.label}>Название проекта *</label>
                        <input
                            type="text"
                            className={style.input}
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Введите название проекта"
                            required
                        />
                    </div>

                    <div className={style.formGroup}>
                        <label className={style.label}>Описание</label>
                        <textarea
                            className={style.textarea}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Опишите ваш проект"
                            rows={6}
                        />
                    </div>

                    <div className={style.formGroup}>
                        <label className={style.label}>Теги</label>
                        <div className={style.tagsContainer}>
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`${style.tagButton} ${formData.tags.includes(tag) ? style.tagButtonActive : ''}`}
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={style.formGroup}>
                        <div className={style.positionsHeader}>
                            <label className={style.label}>Позиции *</label>
                            <button
                                type="button"
                                className={style.addButton}
                                onClick={addPosition}
                            >
                                + Добавить позицию
                            </button>
                        </div>
                        {formData.positions.map((position, index) => (
                            <div key={index} className={style.positionRow}>
                                <input
                                    type="text"
                                    className={style.positionInput}
                                    value={position.role}
                                    onChange={(e) => handlePositionChange(index, 'role', e.target.value)}
                                    placeholder="Название позиции (например, Front-end developer)"
                                    required
                                />
                                <select
                                    className={style.levelSelect}
                                    value={position.level}
                                    onChange={(e) => handlePositionChange(index, 'level', e.target.value)}
                                >
                                    {levels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                                {formData.positions.length > 1 && (
                                    <button
                                        type="button"
                                        className={style.removeButton}
                                        onClick={() => removePosition(index)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={style.formActions}>
                        <button
                            type="button"
                            className={style.cancelButton}
                            onClick={() => navigate(ROUTES.myProjects)}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className={style.submitButton}
                            disabled={loading}
                        >
                            {loading ? 'Создание...' : 'Создать проект'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
