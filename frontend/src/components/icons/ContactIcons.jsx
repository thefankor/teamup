/**
 * Компоненты иконок для контактной информации
 * 
 * КАК ЗАМЕНИТЬ ИКОНКИ:
 * 1. Откройте папку src/assets/icons/contacts/
 * 2. Замените содержимое SVG файлов на свои иконки
 * 3. Сохраните файлы с теми же именами
 * 4. Иконки автоматически обновятся в профиле
 */

import phoneIcon from '../../assets/icons/contacts/phone.svg';
import emailIcon from '../../assets/icons/contacts/email.svg';
import telegramIcon from '../../assets/icons/contacts/telegram.svg';
import githubIcon from '../../assets/icons/contacts/github.svg';
import vkIcon from '../../assets/icons/contacts/vk.svg';
import whatsappIcon from '../../assets/icons/contacts/whatsapp.svg';

export const ContactPhoneIcon = ({ width = 20, height = 20, className }) => {
    return <img src={phoneIcon} alt="Phone" width={width} height={height} className={className} />;
};

export const ContactEmailIcon = ({ width = 20, height = 20, className }) => {
    return <img src={emailIcon} alt="Email" width={width} height={height} className={className} />;
};

export const ContactTelegramIcon = ({ width = 20, height = 20, className }) => {
    return <img src={telegramIcon} alt="Telegram" width={width} height={height} className={className} />;
};

export const ContactGithubIcon = ({ width = 20, height = 20, className }) => {
    return <img src={githubIcon} alt="GitHub" width={width} height={height} className={className} />;
};

export const ContactVkIcon = ({ width = 20, height = 20, className }) => {
    return <img src={vkIcon} alt="VK" width={width} height={height} className={className} />;
};

export const ContactWhatsappIcon = ({ width = 20, height = 20, className }) => {
    return <img src={whatsappIcon} alt="WhatsApp" width={width} height={height} className={className} />;
};

