import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../../src/components/icons/SimpleIcon';
import { useAuth } from '../../src/contexts/AuthContext';
import style from './style.module.scss';

export const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated, user, loading } = useAuth();

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

    const getUserInitials = () => {
        if (!user) return 'U';
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        }
        if (firstName) return firstName[0].toUpperCase();
        if (lastName) return lastName[0].toUpperCase();
        return 'U';
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
                {isAuthenticated ? (
                    <>
                        <Link to="/search" className={style.navLink}>
                            Поиск
                        </Link>
                        <Link to="/my_projects" className={style.navLink}>
                            Мои проекты
                        </Link>
                        <Link to="/notifications" className={style.iconButton} aria-label="Уведомления">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2C8.89543 2 8 2.89543 8 4V5.5C8 6.32843 7.32843 7 6.5 7H4C3.44772 7 3 7.44772 3 8V15C3 15.5523 3.44772 16 4 16H16C16.5523 16 17 15.5523 17 15V8C17 7.44772 16.5523 7 16 7H13.5C12.6716 7 12 6.32843 12 5.5V4C12 2.89543 11.1046 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M7 16V17C7 18.1046 7.89543 19 9 19H11C12.1046 19 13 18.1046 13 17V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <div className={style.userMenu}>
                            <Link to="/profile" className={style.userButton} aria-label="Профиль">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Avatar" className={style.userAvatar} />
                                ) : (
                                    <div className={style.userAvatarPlaceholder}>
                                        {getUserInitials()}
                                    </div>
                                )}
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className={style.loginButton}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2C8.89543 2 8 2.89543 8 4V5.5C8 6.32843 7.32843 7 6.5 7H4C3.44772 7 3 7.44772 3 8V15C3 15.5523 3.44772 16 4 16H16C16.5523 16 17 15.5523 17 15V8C17 7.44772 16.5523 7 16 7H13.5C12.6716 7 12 6.32843 12 5.5V4C12 2.89543 11.1046 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Войти
                        </Link>
                        <Link to="/login?register=true" className={style.registerButton}>
                            Создать аккаунт
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
