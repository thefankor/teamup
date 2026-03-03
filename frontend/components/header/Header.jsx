import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../../src/components/icons/SimpleIcon';
import { useAuth } from '../../src/contexts/AuthContext';
import { RoleGuard } from '../../src/components/ProtectedRoute';
import { ROUTES } from '../../src/app/routes';
import style from './style.module.scss';

export const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();
    const { isAuthenticated, user, loading, logout } = useAuth();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`${ROUTES.search}?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate(ROUTES.search);
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

    const getDisplayName = () => {
        if (!user) return 'Пользователь';
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
        return fullName || user.contact_info?.email || 'Пользователь';
    };

    useEffect(() => {
        if (!menuOpen) return;

        const onClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        const onEscape = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <header className={style.header}>
            <div className={style.logoContainer}>
                <Link to={ROUTES.home} className={style.logo}>
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
                        <Link to={ROUTES.search} className={style.navLink}>
                            Поиск
                        </Link>
                        <Link to={ROUTES.myProjects} className={style.navLink}>
                            Мои проекты
                        </Link>
                        <Link to={ROUTES.createProject} className={style.navLink}>
                            Создать проект
                        </Link>
                        <Link to={ROUTES.notifications} className={style.iconButton} aria-label="Уведомления">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2C8.89543 2 8 2.89543 8 4V5.5C8 6.32843 7.32843 7 6.5 7H4C3.44772 7 3 7.44772 3 8V15C3 15.5523 3.44772 16 4 16H16C16.5523 16 17 15.5523 17 15V8C17 7.44772 16.5523 7 16 7H13.5C12.6716 7 12 6.32843 12 5.5V4C12 2.89543 11.1046 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M7 16V17C7 18.1046 7.89543 19 9 19H11C12.1046 19 13 18.1046 13 17V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <div className={style.userMenu} ref={userMenuRef}>
                            <button
                                type="button"
                                className={style.userButton}
                                aria-label="Открыть меню профиля"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen((prev) => !prev)}
                            >
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt="Аватар пользователя"
                                        className={style.userAvatar}
                                        width="40"
                                        height="40"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className={style.userAvatarPlaceholder}>
                                        {getUserInitials()}
                                    </div>
                                )}
                            </button>

                            {menuOpen && (
                                <div className={style.profileDropdown} role="menu" aria-label="Меню профиля">
                                    <div className={style.profileDropdownHeader}>
                                        <div className={style.profileName}>{getDisplayName()}</div>
                                        <RoleGuard roles={['ADMIN']}>
                                            <span className={style.adminBadge} title="Администратор">✓ Админ</span>
                                        </RoleGuard>
                                    </div>

                                    <Link
                                        to={ROUTES.profile}
                                        className={style.dropdownAction}
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Перейти в профиль
                                    </Link>

                                    <button
                                        type="button"
                                        className={`${style.dropdownAction} ${style.logoutAction}`}
                                        onClick={handleLogout}
                                        disabled={loading}
                                        role="menuitem"
                                    >
                                        Выйти
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to={ROUTES.login} className={style.loginButton}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2C8.89543 2 8 2.89543 8 4V5.5C8 6.32843 7.32843 7 6.5 7H4C3.44772 7 3 7.44772 3 8V15C3 15.5523 3.44772 16 4 16H16C16.5523 16 17 15.5523 17 15V8C17 7.44772 16.5523 7 16 7H13.5C12.6716 7 12 6.32843 12 5.5V4C12 2.89543 11.1046 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Войти
                        </Link>
                        <Link to={`${ROUTES.login}?register=true`} className={style.registerButton}>
                            Создать аккаунт
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
