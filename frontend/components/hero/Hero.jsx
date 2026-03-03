import { Link } from 'react-router-dom';
import { ROUTES } from '../../src/app/routes';
import style from './style.module.scss';

export const Hero = () => {
    return (
        <section className={style.hero}>
            <div className={style.container}>
                <h1 className={style.title}>
                    Платформа для проектов и команд
                </h1>
                <p className={style.subtitle}>
                    Размещайте идеи, ищите единомышленников, присоединяйтесь к командам
                </p>
                <div className={style.actions}>
                    <Link to={ROUTES.search} className={style.primaryButton}>
                        Найти команду →
                    </Link>
                    <Link to={ROUTES.createProject} className={style.secondaryButton}>
                        Поиск участников
                    </Link>
                </div>
            </div>
        </section>
    );
}
