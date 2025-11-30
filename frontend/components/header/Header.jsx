import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon, LoginIcon } from '../../src/components/icons/SimpleIcon';
import style from './style.module.scss';

export const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/search');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    return (
        <header className={style.header}>
            <div className={style.logoContainer}>
                <Link to="/" className={style.logo}>
                    <LogoIcon width={32} height={32} />
                    <span className={style.logoText}>TeamUp</span>
                </Link>
            </div>
            
            <form className={style.searchContainer} onSubmit={handleSearch}>
                <input 
                    type="text" 
                    placeholder="Ищу фронтедера..." 
                    className={style.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button type="submit" className={style.searchButton} aria-label="Поиск">
                    <SearchIcon width={20} height={20} />
                </button>
            </form>

            <div className={style.actions}>
                <Link to="/" className={style.projectsLink}>
                    Проекты
                </Link>
                <Link to="/login" className={style.loginButton}>
                    <LoginIcon width={20} height={20} />
                    Войти
                </Link>
                <Link to="/login?register=true" className={style.registerButton}>
                    Создать аккаунт
                </Link>
            </div>
        </header>
    );
}
