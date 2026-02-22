import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ContactPhoneIcon,
    ContactEmailIcon,
    ContactTelegramIcon,
    ContactGithubIcon,
    ContactVkIcon,
    ContactWhatsappIcon
} from '../../components/icons/ContactIcons';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, projectsAPI } from '../../services/api';
import style from './Profile.module.scss';

export default function Profile() {
    const { user, isAuthenticated, loadUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Перенаправляем, если не авторизован
    useEffect(() => {
        if (!isAuthenticated && !loading) {
            navigate('/login');
        }
    }, [isAuthenticated, loading, navigate]);

    // Загружаем профиль при монтировании
    useEffect(() => {
        if (isAuthenticated && user) {
            setLoading(false);
            loadParticipatingProjects();
        }
    }, [isAuthenticated, user]);

    const loadParticipatingProjects = async () => {
        try {
            setLoadingProjects(true);
            const response = await projectsAPI.participatingProjects({ limit: 100 });
            setParticipatingProjects(response.items || []);
        } catch (err) {
            console.error('Error loading participating projects:', err);
        } finally {
            setLoadingProjects(false);
        }
    };

    // Состояния для модальных окон
    const [editBasic, setEditBasic] = useState(false);
    const [editAbout, setEditAbout] = useState(false);
    const [editContacts, setEditContacts] = useState(false);
    const [editEducation, setEditEducation] = useState(false);
    const [editSkills, setEditSkills] = useState(false);

    // Временные данные для редактирования
    const [editData, setEditData] = useState({});

    // Состояния для проектов участника
    const [participatingProjects, setParticipatingProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const openEditModal = (type, data) => {
        setEditData(data);
        switch (type) {
            case 'basic':
                setEditBasic(true);
                break;
            case 'about':
                setEditAbout(true);
                break;
            case 'contacts':
                setEditContacts(true);
                break;
            case 'education':
                setEditEducation(true);
                break;
            case 'skills':
                setEditSkills(true);
                break;
        }
    };

    const closeEditModal = (type) => {
        switch (type) {
            case 'basic':
                setEditBasic(false);
                break;
            case 'about':
                setEditAbout(false);
                break;
            case 'contacts':
                setEditContacts(false);
                break;
            case 'education':
                setEditEducation(false);
                break;
            case 'skills':
                setEditSkills(false);
                break;
        }
        setEditData({});
    };

    const handleSave = async (type) => {
        setError('');
        try {
            let updatedProfile;

            switch (type) {
                case 'basic':
                    updatedProfile = await userAPI.updateProfile({
                        first_name: editData.firstName || null,
                        last_name: editData.lastName || null,
                        position: editData.role || null,
                    });
                    if (editData.tags) {
                        await userAPI.updateTags(editData.tags);
                        updatedProfile = await userAPI.getProfile();
                    }
                    break;
                case 'about':
                    updatedProfile = await userAPI.updateProfile({
                        about: editData.about || null,
                        looking_for_projects: editData.lookingForProjects !== undefined ? editData.lookingForProjects : user?.looking_for_projects,
                    });
                    break;
                case 'contacts':
                    updatedProfile = await userAPI.updateContacts({
                        phone: editData.contacts?.phone || null,
                        email: editData.contacts?.email || null,
                        tg_username: editData.contacts?.telegram?.replace('@', '') || null,
                        github_username: editData.contacts?.github?.replace('@', '') || null,
                        vk_username: editData.contacts?.vk?.replace('@', '') || null,
                        whatsapp_username: editData.contacts?.whatsapp?.replace('@', '') || null,
                    });
                    break;
                case 'skills':
                    updatedProfile = await userAPI.updateSkills(editData.skills || []);
                    break;
                case 'education':
                    // Образование обрабатывается отдельно
                    closeEditModal(type);
                    return;
                default:
                    return;
            }

            if (updatedProfile) {
                loadUser();
            }
            closeEditModal(type);
        } catch (err) {
            setError(err.message || 'Ошибка сохранения');
        }
    };

    const handleAddEducation = async () => {
        // TODO: Добавить модальное окно для добавления образования
    };

    const handleUpdateEducation = async (eduId, data) => {
        try {
            await userAPI.updateEducation(eduId, {
                university: data.university,
                specialty: data.specialty,
                degree: data.degree,
                graduation_year: parseInt(data.year),
            });
            await loadUser();
        } catch (err) {
            setError(err.message || 'Ошибка обновления образования');
        }
    };

    const handleDeleteEducation = async (eduId) => {
        try {
            await userAPI.deleteEducation(eduId);
            await loadUser();
        } catch (err) {
            setError(err.message || 'Ошибка удаления образования');
        }
    };

    const availableTags = ['Front-end', 'Back-end', 'Designer', 'ML-developer'];

    if (loading || !user) {
        return <div className={style.profilePage}><div className={style.container}>Загрузка...</div></div>;
    }

    // Преобразуем данные пользователя в формат для отображения
    const profile = {
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        role: user.position || '',
        avatar: user.avatar_url,
        tags: user.tags || [],
        lookingForProjects: user.looking_for_projects || false,
        about: user.about || '',
        skills: user.skills || [],
        contacts: {
            phone: user.contact_info?.phone || '',
            email: user.contact_info?.email || '',
            telegram: user.contact_info?.tg_username ? `@${user.contact_info.tg_username}` : '',
            github: user.contact_info?.github_username ? `@${user.contact_info.github_username}` : '',
            vk: user.contact_info?.vk_username ? `@${user.contact_info.vk_username}` : '',
            whatsapp: user.contact_info?.whatsapp_username ? `@${user.contact_info.whatsapp_username}` : '',
        },
        education: (user.education || []).map(edu => ({
            id: edu.id,
            university: edu.university,
            specialty: edu.specialty,
            degree: edu.degree,
            year: edu.graduation_year.toString(),
        })),
        projects: user.projects || [],
    };

    return (
        <div className={style.profilePage}>
            {error && <div className={style.error}>{error}</div>}
            <div className={style.container}>
                {/* Основная информация */}
                <div className={style.card}>
                    <button
                        className={style.editButton}
                        onClick={() => openEditModal('basic', {
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            role: profile.role,
                            tags: profile.tags
                        })}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M11.05 3.00002L4.20831 10.2417C3.94998 10.5167 3.69998 11.0584 3.64998 11.4334L3.34165 14.1334C3.23331 15.1084 3.93331 15.775 4.89998 15.6084L7.58331 15.15C7.95831 15.0834 8.48331 14.8084 8.74165 14.525L15.5833 7.28335C16.7666 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2333 1.75002 11.05 3.00002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className={style.profileHeader}>
                        {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.firstName} className={style.avatar} />
                        ) : (
                            <div className={style.avatarPlaceholder}>
                                {profile.firstName && profile.lastName
                                    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
                                    : profile.firstName
                                        ? profile.firstName[0].toUpperCase()
                                        : 'U'
                                }
                            </div>
                        )}
                        <div className={style.profileInfo}>
                            <h1 className={style.name}>{profile.firstName} {profile.lastName}</h1>
                            <p className={style.role}>{profile.role}</p>
                            <div className={style.tags}>
                                {profile.tags.map((tag, index) => (
                                    <span key={index} className={style.tag} style={{ backgroundColor: getTagColor(tag) }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <label className={style.toggle}>
                                <input
                                    type="checkbox"
                                    checked={profile.lookingForProjects}
                                    onChange={async (e) => {
                                        try {
                                            await userAPI.updateProfile({ looking_for_projects: e.target.checked });
                                            await loadUser();
                                        } catch (err) {
                                            setError(err.message || 'Ошибка обновления');
                                        }
                                    }}
                                />
                                <span>Ищу проекты</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* О себе */}
                <div className={style.card}>
                    <button
                        className={style.editButton}
                        onClick={() => openEditModal('about', { about: profile.about })}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M11.05 3.00002L4.20831 10.2417C3.94998 10.5167 3.69998 11.0584 3.64998 11.4334L3.34165 14.1334C3.23331 15.1084 3.93331 15.775 4.89998 15.6084L7.58331 15.15C7.95831 15.0834 8.48331 14.8084 8.74165 14.525L15.5833 7.28335C16.7666 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2333 1.75002 11.05 3.00002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h2 className={style.sectionTitle}>О себе</h2>
                    <p className={style.description}>{profile.about}</p>
                    <div className={style.skillsSection}>
                        <div className={style.skillsHeader}>
                            <h3 className={style.subtitle}>Навыки</h3>
                            <button
                                className={style.editSmallButton}
                                onClick={() => openEditModal('skills', { skills: profile.skills })}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <path d="M11.05 3.00002L4.20831 10.2417C3.94998 10.5167 3.69998 11.0584 3.64998 11.4334L3.34165 14.1334C3.23331 15.1084 3.93331 15.775 4.89998 15.6084L7.58331 15.15C7.95831 15.0834 8.48331 14.8084 8.74165 14.525L15.5833 7.28335C16.7666 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2333 1.75002 11.05 3.00002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <div className={style.skillsList}>
                            {profile.skills.map((skill, index) => (
                                <span key={index} className={style.skillTag}>{skill}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Контактная информация */}
                <div className={style.card}>
                    <button
                        className={style.editButton}
                        onClick={() => openEditModal('contacts', { contacts: profile.contacts })}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M11.05 3.00002L4.20831 10.2417C3.94998 10.5167 3.69998 11.0584 3.64998 11.4334L3.34165 14.1334C3.23331 15.1084 3.93331 15.775 4.89998 15.6084L7.58331 15.15C7.95831 15.0834 8.48331 14.8084 8.74165 14.525L15.5833 7.28335C16.7666 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2333 1.75002 11.05 3.00002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h2 className={style.sectionTitle}>Контактная информация</h2>
                    <div className={style.contactsGrid}>
                        <div className={style.contactItem}>
                            <ContactPhoneIcon />
                            <span>Телефон</span>
                            <span className={style.contactValue}>{profile.contacts.phone}</span>
                        </div>
                        <div className={style.contactItem}>
                            <ContactEmailIcon />
                            <span>Почта</span>
                            <span className={style.contactValue}>{profile.contacts.email}</span>
                        </div>
                        <div className={style.contactItem}>
                            <ContactTelegramIcon />
                            <span>Telegram</span>
                            <span className={style.contactValue}>{profile.contacts.telegram}</span>
                        </div>
                        <div className={style.contactItem}>
                            <ContactGithubIcon />
                            <span>GitHub</span>
                            <span className={style.contactValue}>{profile.contacts.github}</span>
                        </div>
                        <div className={style.contactItem}>
                            <ContactVkIcon />
                            <span>VK</span>
                            <span className={style.contactValue}>{profile.contacts.vk}</span>
                        </div>
                        <div className={style.contactItem}>
                            <ContactWhatsappIcon />
                            <span>WhatsApp</span>
                            <span className={style.contactValue}>{profile.contacts.whatsapp}</span>
                        </div>
                    </div>
                </div>

                {/* Образование */}
                <div className={style.card}>
                    <button
                        className={style.editButton}
                        onClick={() => openEditModal('education', { education: profile.education })}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M11.05 3.00002L4.20831 10.2417C3.94998 10.5167 3.69998 11.0584 3.64998 11.4334L3.34165 14.1334C3.23331 15.1084 3.93331 15.775 4.89998 15.6084L7.58331 15.15C7.95831 15.0834 8.48331 14.8084 8.74165 14.525L15.5833 7.28335C16.7666 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2333 1.75002 11.05 3.00002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h2 className={style.sectionTitle}>Образование</h2>
                    {profile.education.length === 0 ? (
                        <p className={style.emptyText}>Образование не указано</p>
                    ) : (
                        profile.education.map((edu) => (
                            <div key={edu.id} className={style.educationItem}>
                                <div className={style.educationContent}>
                                    <h3 className={style.educationTitle}>{edu.university}</h3>
                                    <p className={style.educationSpecialty}>{edu.specialty}</p>
                                    <p className={style.educationDegree}>{edu.degree}, {edu.year}</p>
                                </div>
                                <button
                                    className={style.deleteButton}
                                    onClick={() => handleDeleteEducation(edu.id)}
                                    aria-label="Удалить"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Проекты */}
                <div className={style.card}>
                    <h2 className={style.sectionTitle}>Проекты</h2>

                    {/* Проекты, в которых участвуешь */}
                    {loadingProjects ? (
                        <div className={style.loading}>Загрузка проектов...</div>
                    ) : participatingProjects.length > 0 && (
                        <div className={style.projectsSubsection}>
                            <h3 className={style.subtitle}>Проекты, в которых участвую</h3>
                            <div className={style.projectsList}>
                                {participatingProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/project/${project.id}`}
                                        className={style.projectCard}
                                    >
                                        <h4 className={style.projectCardTitle}>{project.title}</h4>
                                        {project.excerpt && (
                                            <p className={style.projectExcerpt}>{project.excerpt}</p>
                                        )}
                                        {project.tags && project.tags.length > 0 && (
                                            <div className={style.projectTags}>
                                                {project.tags.slice(0, 3).map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className={style.projectTag}
                                                        style={{ backgroundColor: getTagColor(tag) }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span className={style.projectDate}>
                                            {new Date(project.created_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Мои проекты (где я владелец) */}
                    {profile.projects && profile.projects.length > 0 && (
                        <div className={style.projectsSubsection}>
                            <h3 className={style.subtitle}>Мои проекты</h3>
                            {profile.projects.map((project) => (
                                <div key={project.id} className={style.projectItem}>
                                    <h3 className={style.projectTitle}>{project.title}</h3>
                                    <p className={style.projectDescription}>{project.description}</p>
                                    <div className={style.projectTags}>
                                        {project.tags.map((tag, index) => (
                                            <span key={index} className={style.tag} style={{ backgroundColor: getTagColor(tag) }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно редактирования основной информации */}
            {editBasic && (
                <Modal
                    title="Основная информация"
                    onClose={() => closeEditModal('basic')}
                    onSave={() => handleSave('basic')}
                >
                    <div className={style.modalForm}>
                        <label className={style.modalLabel}>Имя</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.firstName || ''}
                            onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                            placeholder="Имя"
                        />
                        <label className={style.modalLabel}>Фамилия</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.lastName || ''}
                            onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                            placeholder="Фамилия"
                        />
                        <label className={style.modalLabel}>Позиции</label>
                        <div className={style.modalTags}>
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`${style.modalTag} ${(editData.tags || []).includes(tag) ? style.modalTagActive : ''}`}
                                    onClick={() => {
                                        const tags = editData.tags || [];
                                        const newTags = tags.includes(tag)
                                            ? tags.filter(t => t !== tag)
                                            : [...tags, tag];
                                        setEditData({ ...editData, tags: newTags });
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <label className={style.modalLabel}>Краткое описание</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.role || ''}
                            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                            placeholder="Краткое описание"
                        />
                    </div>
                </Modal>
            )}

            {/* Модальное окно редактирования "О себе" */}
            {editAbout && (
                <Modal
                    title="О себе"
                    onClose={() => closeEditModal('about')}
                    onSave={() => handleSave('about')}
                >
                    <div className={style.modalForm}>
                        <label className={style.modalLabel}>Описание</label>
                        <textarea
                            className={style.modalTextarea}
                            value={editData.about || ''}
                            onChange={(e) => setEditData({ ...editData, about: e.target.value })}
                            placeholder="Расскажите о себе"
                            rows={4}
                        />
                    </div>
                </Modal>
            )}

            {/* Модальное окно редактирования навыков */}
            {editSkills && (
                <Modal
                    title="Навыки"
                    onClose={() => closeEditModal('skills')}
                    onSave={() => handleSave('skills')}
                >
                    <div className={style.modalForm}>
                        <label className={style.modalLabel}>Навыки</label>
                        <div className={style.modalTags}>
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`${style.modalTag} ${(editData.skills || []).includes(tag) ? style.modalTagActive : ''}`}
                                    onClick={() => {
                                        const skills = editData.skills || [];
                                        const newSkills = skills.includes(tag)
                                            ? skills.filter(s => s !== tag)
                                            : [...skills, tag];
                                        setEditData({ ...editData, skills: newSkills });
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Модальное окно редактирования контактов */}
            {editContacts && (
                <Modal
                    title="Контактная информация"
                    onClose={() => closeEditModal('contacts')}
                    onSave={() => handleSave('contacts')}
                >
                    <div className={style.modalForm}>
                        <label className={style.modalLabel}>Телефон</label>
                        <input
                            type="tel"
                            className={style.modalInput}
                            value={editData.contacts?.phone || ''}
                            onChange={(e) => setEditData({ ...editData, contacts: { ...editData.contacts, phone: e.target.value } })}
                        />
                        <label className={style.modalLabel}>Почта</label>
                        <input
                            type="email"
                            className={style.modalInput}
                            value={editData.contacts?.email || ''}
                            onChange={(e) => setEditData({ ...editData, contacts: { ...editData.contacts, email: e.target.value } })}
                        />
                        <label className={style.modalLabel}>Telegram</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.contacts?.telegram || ''}
                            onChange={(e) => setEditData({ ...editData, contacts: { ...editData.contacts, telegram: e.target.value } })}
                        />
                        <label className={style.modalLabel}>GitHub</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.contacts?.github || ''}
                            onChange={(e) => setEditData({ ...editData, contacts: { ...editData.contacts, github: e.target.value } })}
                        />
                        <label className={style.modalLabel}>VK</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.contacts?.vk || ''}
                            onChange={(e) => setEditData({ ...editData, contacts: { ...editData.contacts, vk: e.target.value } })}
                        />
                        <label className={style.modalLabel}>WhatsApp</label>
                        <input
                            type="text"
                            className={style.modalInput}
                            value={editData.contacts?.whatsapp || ''}
                            onChange={(e) => setEditData({ ...editData, contacts: { ...editData.contacts, whatsapp: e.target.value } })}
                        />
                    </div>
                </Modal>
            )}

            {/* Модальное окно редактирования образования */}
            {editEducation && (
                <Modal
                    title="Образование"
                    onClose={() => closeEditModal('education')}
                    onSave={() => handleSave('education')}
                >
                    <div className={style.modalForm}>
                        {(editData.education || []).map((edu, index) => (
                            <div key={index} className={style.educationEditItem}>
                                <label className={style.modalLabel}>Университет</label>
                                <input
                                    type="text"
                                    className={style.modalInput}
                                    value={edu.university || ''}
                                    onChange={(e) => {
                                        const newEducation = [...(editData.education || [])];
                                        newEducation[index] = { ...newEducation[index], university: e.target.value };
                                        setEditData({ ...editData, education: newEducation });
                                    }}
                                />
                                <label className={style.modalLabel}>Специальность</label>
                                <input
                                    type="text"
                                    className={style.modalInput}
                                    value={edu.specialty || ''}
                                    onChange={(e) => {
                                        const newEducation = [...(editData.education || [])];
                                        newEducation[index] = { ...newEducation[index], specialty: e.target.value };
                                        setEditData({ ...editData, education: newEducation });
                                    }}
                                />
                                <label className={style.modalLabel}>Степень</label>
                                <input
                                    type="text"
                                    className={style.modalInput}
                                    value={edu.degree || ''}
                                    onChange={(e) => {
                                        const newEducation = [...(editData.education || [])];
                                        newEducation[index] = { ...newEducation[index], degree: e.target.value };
                                        setEditData({ ...editData, education: newEducation });
                                    }}
                                />
                                <label className={style.modalLabel}>Год</label>
                                <input
                                    type="text"
                                    className={style.modalInput}
                                    value={edu.year || ''}
                                    onChange={(e) => {
                                        const newEducation = [...(editData.education || [])];
                                        newEducation[index] = { ...newEducation[index], year: e.target.value };
                                        setEditData({ ...editData, education: newEducation });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
}

// Компонент модального окна
function Modal({ title, children, onClose, onSave }) {
    return (
        <div className={style.modalOverlay} onClick={onClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <div className={style.modalHeader}>
                    <h2 className={style.modalTitle}>{title}</h2>
                    <button className={style.modalClose} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className={style.modalBody}>
                    {children}
                </div>
                <div className={style.modalFooter}>
                    <button className={style.modalCancelButton} onClick={onClose}>
                        Отмена
                    </button>
                    <button className={style.modalSaveButton} onClick={onSave}>
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    );
}

// Функция для получения цвета тега
function getTagColor(tag) {
    const colors = {
        'Front-end': '#d1fae5',
        'Back-end': '#dbeafe',
        'Designer': '#e9d5ff',
        'ML-developer': '#fef3c7',
    };
    return colors[tag] || '#f3f4f6';
}
