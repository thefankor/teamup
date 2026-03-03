import { Link } from 'react-router-dom';
import { routePaths } from '../../src/app/routes';
import style from './style.module.scss';

export const ProjectCard = ({ project }) => {
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

    return (
        <article className={style.card}>
            <div className={style.content}>
                <h3 className={style.title}>{project.title}</h3>
                <p className={style.description}>{project.excerpt || project.description || ''}</p>
                
                <div className={style.tags}>
                    {project.tags?.map((tag, index) => (
                        <span 
                            key={index} 
                            className={style.tag}
                            style={{ backgroundColor: getTagColor(tag) }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className={style.footer}>
                    <span className={style.date}>
                        {formatDate(project.created_at)}
                    </span>
                    <Link 
                        to={routePaths.projectDetails(project.id)}
                        className={style.applyButton}
                    >
                        Откликнуться
                    </Link>
                </div>
            </div>
        </article>
    );
}
