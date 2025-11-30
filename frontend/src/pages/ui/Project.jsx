import { useState } from 'react';
import { useParams } from 'react-router-dom';
import style from './Project.module.scss';

export default function Project() {
    const { id } = useParams();
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [message, setMessage] = useState('');

    // Моковые данные проекта
    const project = {
        id: id || '1',
        title: 'Mobile app project',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        tags: ['Front-end', 'Back-end', 'Designer', 'ML-developer'],
        created_at: '2025-09-19T17:55:00Z',
        team: [
            { id: '1', name: 'John Carter', role: 'CEO & CO-FOUNDER', avatar: 'https://i.pravatar.cc/150?img=1' },
            { id: '2', name: 'Sophie Moore', role: 'CTO & CO-FOUNDER', avatar: 'https://i.pravatar.cc/150?img=5' },
            { id: '3', name: 'Matt Cannon', role: 'VP OF MARKETING', avatar: 'https://i.pravatar.cc/150?img=12' },
            { id: '4', name: 'Patrick Meyer', role: 'VP OF SALES', avatar: 'https://i.pravatar.cc/150?img=15' },
            { id: '5', name: 'Lily Woods', role: 'VP OF PRODUCT', avatar: 'https://i.pravatar.cc/150?img=20' }
        ],
        openPositions: [
            { id: '1', role: 'Front-end developer', level: 'MIDDLE+' },
            { id: '2', role: 'Back-end developer', level: 'MIDDLE' },
            { id: '3', role: 'Designer', level: 'JUNIOR+' },
            { id: '4', role: 'ML developer', level: 'MIDDLE' }
        ]
    };

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

    const handlePositionToggle = (positionId) => {
        setSelectedPositions(prev => 
            prev.includes(positionId)
                ? prev.filter(id => id !== positionId)
                : [...prev, positionId]
        );
    };

    const handleSubmitApplication = (e) => {
        e.preventDefault();
        if (selectedPositions.length === 0) {
            alert('Выберите хотя бы одну позицию');
            return;
        }
        // TODO: Отправить заявку на API
        setShowApplicationModal(false);
        setShowSuccessModal(true);
        setSelectedPositions([]);
        setMessage('');
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
    };

    return (
        <div className={style.projectPage}>
            <div className={style.container}>
                {/* Информация о проекте */}
                <div className={style.projectCard}>
                    <div className={style.projectHeader}>
                        <div className={style.projectTitleSection}>
                            <h1 className={style.projectTitle}>{project.title}</h1>
                            <div className={style.tags}>
                                {project.tags.map((tag, index) => (
                                    <span 
                                        key={index} 
                                        className={style.tag}
                                        style={{ backgroundColor: getTagColor(tag) }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <span className={style.projectDate}>
                            {formatDate(project.created_at)}
                        </span>
                    </div>
                    <p className={style.projectDescription}>{project.description}</p>
                    <button 
                        className={style.applyButton}
                        onClick={() => setShowApplicationModal(true)}
                    >
                        Откликнуться
                    </button>
                </div>

                {/* Команда */}
                <div className={style.section}>
                    <h2 className={style.sectionTitle}>Уже в нашей команде</h2>
                    <div className={style.teamGrid}>
                        {project.team.map((member) => (
                            <div key={member.id} className={style.teamCard}>
                                <img 
                                    src={member.avatar} 
                                    alt={member.name}
                                    className={style.teamAvatar}
                                />
                                <div className={style.teamInfo}>
                                    <h3 className={style.teamName}>{member.name}</h3>
                                    <p className={style.teamRole}>{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Открытые позиции */}
                <div className={style.section}>
                    <h2 className={style.sectionTitle}>В активном поиске</h2>
                    <div className={style.positionsGrid}>
                        {project.openPositions.map((position) => (
                            <div key={position.id} className={style.positionCard}>
                                <svg className={style.searchIcon} width="24" height="24" viewBox="0 0 20 20" fill="none">
                                    <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <div className={style.positionInfo}>
                                    <h3 className={style.positionRole}>{position.role}</h3>
                                    <p className={style.positionLevel}>{position.level}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Форма отклика */}
                <div className={style.section}>
                    <h2 className={style.sectionTitle}>Отправить заявку</h2>
                    <form onSubmit={handleSubmitApplication} className={style.applicationForm}>
                        <p className={style.formInstruction}>
                            Выберите одну или несколько позиций
                        </p>
                        <div className={style.positionTags}>
                            {project.openPositions.map((position) => (
                                <button
                                    key={position.id}
                                    type="button"
                                    className={`${style.positionTag} ${selectedPositions.includes(position.id) ? style.positionTagActive : ''}`}
                                    onClick={() => handlePositionToggle(position.id)}
                                    style={{ 
                                        backgroundColor: selectedPositions.includes(position.id) 
                                            ? getTagColor(position.role.split(' ')[0]) 
                                            : '#f3f4f6' 
                                    }}
                                >
                                    {position.role}
                                </button>
                            ))}
                        </div>
                        <label className={style.formLabel}>Сообщение</label>
                        <textarea
                            className={style.messageInput}
                            placeholder="Please type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                        />
                        <button type="submit" className={style.submitButton}>
                            Откликнуться
                        </button>
                    </form>
                </div>
            </div>

            {/* Модальное окно отправки заявки */}
            {showApplicationModal && (
                <div className={style.modalOverlay} onClick={() => setShowApplicationModal(false)}>
                    <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={style.modalHeader}>
                            <h2 className={style.modalTitle}>Отправить заявку</h2>
                            <button 
                                className={style.modalClose}
                                onClick={() => setShowApplicationModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitApplication} className={style.modalForm}>
                            <p className={style.formInstruction}>
                                Выберите одну или несколько позиций
                            </p>
                            <div className={style.positionTags}>
                                {project.openPositions.map((position) => (
                                    <button
                                        key={position.id}
                                        type="button"
                                        className={`${style.positionTag} ${selectedPositions.includes(position.id) ? style.positionTagActive : ''}`}
                                        onClick={() => handlePositionToggle(position.id)}
                                        style={{ 
                                            backgroundColor: selectedPositions.includes(position.id) 
                                                ? getTagColor(position.role.split(' ')[0]) 
                                                : '#f3f4f6' 
                                        }}
                                    >
                                        {position.role}
                                    </button>
                                ))}
                            </div>
                            <label className={style.formLabel}>Сообщение</label>
                            <textarea
                                className={style.messageInput}
                                placeholder="Please type your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                            />
                            <div className={style.modalFooter}>
                                <button 
                                    type="button"
                                    className={style.modalCancelButton}
                                    onClick={() => setShowApplicationModal(false)}
                                >
                                    Отмена
                                </button>
                                <button type="submit" className={style.modalSubmitButton}>
                                    Откликнуться
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно успешной отправки */}
            {showSuccessModal && (
                <div className={style.modalOverlay} onClick={handleCloseSuccess}>
                    <div className={style.successModal} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={style.modalClose}
                            onClick={handleCloseSuccess}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        <div className={style.successIcon}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="24" fill="#3b82f6" opacity="0.1"/>
                                <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="2"/>
                                <path d="M16 24L22 30L32 18" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className={style.successTitle}>Заявка успешно отправлена</h2>
                        <button 
                            className={style.successButton}
                            onClick={handleCloseSuccess}
                        >
                            Продолжить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
