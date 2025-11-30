import { useState } from 'react';
import { Link } from 'react-router-dom';
import style from './Notifications.module.scss';

export default function Notifications() {
    // Моковые данные уведомлений
    const [notifications, setNotifications] = useState([
        {
            id: '1',
            message: 'Вас приняли в проект:',
            projectName: 'Mobile app project',
            projectId: '1',
            timestamp: '2025-09-19T17:55:00Z',
            read: true
        },
        {
            id: '2',
            message: 'Вас приняли в проект:',
            projectName: 'E-commerce platform',
            projectId: '2',
            timestamp: '2025-09-19T16:30:00Z',
            read: true
        },
        {
            id: '3',
            message: 'Вас приняли в проект:',
            projectName: 'AI Chatbot',
            projectId: '3',
            timestamp: '2025-09-19T15:15:00Z',
            read: false
        },
        {
            id: '4',
            message: 'Вас приняли в проект:',
            projectName: 'Social Media Dashboard',
            projectId: '4',
            timestamp: '2025-09-19T14:00:00Z',
            read: false
        }
    ]);

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

    const handleNotificationClick = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId 
                    ? { ...notif, read: true }
                    : notif
            )
        );
    };

    return (
        <div className={style.notificationsPage}>
            <div className={style.container}>
                <h1 className={style.title}>Уведомления</h1>
                
                <div className={style.notificationsList}>
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={style.notificationCard}
                            onClick={() => handleNotificationClick(notification.id)}
                        >
                            <div className={style.notificationContent}>
                                <p className={style.notificationText}>
                                    {notification.message}{' '}
                                    <Link 
                                        to={`/project/${notification.projectId}`}
                                        className={style.projectLink}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {notification.projectName}
                                    </Link>
                                </p>
                                <p className={style.notificationTime}>
                                    {formatDate(notification.timestamp)}
                                </p>
                            </div>
                            <div className={style.notificationIcon}>
                                {notification.read ? (
                                    <div className={style.iconRead}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                ) : (
                                    <div className={style.iconUnread}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M10 3L4.5 8.5L2 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {notifications.length === 0 && (
                    <div className={style.emptyState}>
                        <p>У вас пока нет уведомлений</p>
                    </div>
                )}
            </div>
        </div>
    );
}
