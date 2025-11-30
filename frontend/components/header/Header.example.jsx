/**
 * ПРИМЕР: Как заменить иконки на свои
 * 
 * Скопируйте нужные части в Header.jsx
 */

import { Link } from 'react-router-dom';
import style from './style.module.scss';

export const Header = () => {
    return (
        <header className={style.header}>
            <div className={style.logoContainer}>
                <div className={style.logo}>
                    {/* ============================================
                        ВАРИАНТ 1: Заменить на свой SVG логотип
                        ============================================ */}
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        {/* ВСТАВЬТЕ СЮДА КОД ВАШЕГО SVG ЛОГОТИПА */}
                        <path d="..." fill="#3b82f6"/>
                    </svg>
                    
                    {/* ИЛИ ВАРИАНТ 2: Использовать изображение */}
                    {/* <img src="/icons/my-logo.svg" alt="TeamUp" width={32} height={32} /> */}
                    
                    {/* ИЛИ ВАРИАНТ 3: Оставить текущий (4 точки) */}
                    {/* <div className={style.logoDots}>
                        <span className={style.dot}></span>
                        <span className={style.dot}></span>
                        <span className={style.dot}></span>
                        <span className={style.dot}></span>
                    </div> */}
                    
                    <span className={style.logoText}>TeamUp</span>
                </div>
            </div>
            
            <div className={style.searchContainer}>
                <input 
                    type="text" 
                    placeholder="Ищу фронтедера..." 
                    className={style.searchInput}
                />
                {/* ============================================
                    ИКОНКА ПОИСКА - замените на свою
                    ============================================ */}
                <svg className={style.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    {/* ВСТАВЬТЕ СЮДА КОД ВАШЕЙ ИКОНКИ ПОИСКА */}
                    <path d="..." stroke="currentColor"/>
                </svg>
            </div>

            <div className={style.actions}>
                <Link to="/login" className={style.loginButton}>
                    {/* ============================================
                        ИКОНКА ВХОДА - замените на свою
                        ============================================ */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        {/* ВСТАВЬТЕ СЮДА КОД ВАШЕЙ ИКОНКИ ВХОДА */}
                        <path d="..." stroke="currentColor"/>
                    </svg>
                    Войти
                </Link>
                <Link to="/login" className={style.registerButton}>
                    Создать аккаунт
                </Link>
            </div>
        </header>
    );
}

