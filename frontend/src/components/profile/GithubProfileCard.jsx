import { useEffect, useState } from 'react';
import { githubAPI } from '../../services/api';
import style from './GithubProfileCard.module.scss';

const formatDate = (value) =>
    new Date(value).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

export function GithubProfileCard({ username }) {
    const normalizedUsername = username?.replace(/^@/, '').trim();
    const [profile, setProfile] = useState(null);
    const [repos, setRepos] = useState([]);
    const [profileLoading, setProfileLoading] = useState(false);
    const [reposLoading, setReposLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [reposError, setReposError] = useState('');

    const profileUnavailableMessage = profileError
        ? 'Информация GitHub сейчас недоступна.'
        : '';
    const reposUnavailableMessage = reposError
        ? 'Репозитории GitHub сейчас недоступны.'
        : '';

    useEffect(() => {
        let cancelled = false;

        if (!normalizedUsername) {
            setProfile(null);
            setRepos([]);
            setProfileError('');
            setReposError('');
            return undefined;
        }

        const loadGithubData = async () => {
            try {
                setProfileLoading(true);
                setProfileError('');
                setRepos([]);
                setReposError('');

                const profileData = await githubAPI.getUserProfile(normalizedUsername);
                if (cancelled) return;
                setProfile(profileData);
            } catch (error) {
                if (cancelled) return;
                setProfile(null);
                setProfileError(error.message || 'Не удалось загрузить GitHub-профиль');
                return;
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                }
            }

            try {
                setReposLoading(true);
                const reposData = await githubAPI.getTopRepos(normalizedUsername, 3);
                if (cancelled) return;
                setRepos(reposData.items || []);
            } catch (error) {
                if (cancelled) return;
                setRepos([]);
                setReposError(error.message || 'Не удалось загрузить репозитории');
            } finally {
                if (!cancelled) {
                    setReposLoading(false);
                }
            }
        };

        loadGithubData();

        return () => {
            cancelled = true;
        };
    }, [normalizedUsername]);

    if (!normalizedUsername) {
        return null;
    }

    return (
        <section className={style.section} aria-live="polite">
            <div className={style.header}>
                {profile?.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt={`GitHub avatar ${profile.login}`}
                        className={style.avatar}
                        width="72"
                        height="72"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className={style.avatarPlaceholder}>
                        {normalizedUsername.slice(0, 1).toUpperCase()}
                    </div>
                )}

                <div className={style.headerContent}>
                    <div className={style.eyebrow}>GitHub</div>

                    {profileLoading && !profile ? (
                        <p className={style.loadingText}>Загружаем профиль GitHub...</p>
                    ) : profileError ? (
                        <p className={style.mutedText}>{profileUnavailableMessage}</p>
                    ) : profile ? (
                        <>
                            <div className={style.titleRow}>
                                <h3 className={style.login}>@{profile.login}</h3>
                                <a
                                    href={profile.profile_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={style.link}
                                >
                                    Открыть профиль
                                </a>
                            </div>
                            <p className={style.meta}>
                                На GitHub с {formatDate(profile.created_at)}
                            </p>
                        </>
                    ) : null}
                </div>
            </div>

            {profile && (
                <div className={style.stats}>
                    <div className={style.stat}>
                        <span className={style.statLabel}>Репозитории</span>
                        <span className={style.statValue}>{profile.public_repos}</span>
                    </div>
                    <div className={style.stat}>
                        <span className={style.statLabel}>Подписчики</span>
                        <span className={style.statValue}>{profile.followers}</span>
                    </div>
                    <div className={style.stat}>
                        <span className={style.statLabel}>Подписки</span>
                        <span className={style.statValue}>{profile.following}</span>
                    </div>
                    <div className={style.stat}>
                        <span className={style.statLabel}>Профиль API</span>
                        <span className={style.statValue}>
                            <a href={profile.api_url} target="_blank" rel="noreferrer" className={style.repoName}>
                                API
                            </a>
                        </span>
                    </div>
                </div>
            )}

            {!profileError && (
                <>
                    <div className={style.repoHeader}>
                        <h3 className={style.repoTitle}>Последние репозитории</h3>
                        {reposLoading && <p className={style.loadingText}>Загружаем...</p>}
                    </div>

                    {reposError ? (
                        <p className={style.mutedText}>{reposUnavailableMessage}</p>
                    ) : repos.length > 0 ? (
                        <div className={style.repoList}>
                            {repos.map((repo) => (
                                <article key={repo.html_url} className={style.repoCard}>
                                    <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={style.repoName}
                                    >
                                        {repo.name}
                                    </a>
                                    <p className={style.repoDescription}>
                                        {repo.description || 'Описание не указано'}
                                    </p>
                                    <div className={style.repoMeta}>
                                        <span>Stars: {repo.stargazers_count}</span>
                                        <span>Forks: {repo.forks_count}</span>
                                        <span>Обновлен: {formatDate(repo.updated_at)}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : !reposLoading && profile ? (
                        <p className={style.emptyText}>Публичные репозитории не найдены.</p>
                    ) : null}
                </>
            )}
        </section>
    );
}
