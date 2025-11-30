/**
 * Универсальный компонент для иконок
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * <Icon name="logo" width={32} height={32} />
 * <Icon name="login" className={style.icon} />
 * 
 * КАК ДОБАВИТЬ СВОЮ ИКОНКУ:
 * 1. Положите SVG файл в src/assets/icons/
 * 2. Импортируйте его здесь
 * 3. Добавьте в объект icons
 */

// Импорты SVG файлов
import LogoIcon from '../../assets/icons/logo.svg?react';
import LoginIcon from '../../assets/icons/login.svg?react';
import SearchIcon from '../../assets/icons/search.svg?react';

const icons = {
    logo: LogoIcon,
    login: LoginIcon,
    search: SearchIcon,
};

export const Icon = ({ name, width, height, className, ...props }) => {
    const IconComponent = icons[name];
    
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found. Available: ${Object.keys(icons).join(', ')}`);
        return null;
    }
    
    return (
        <IconComponent 
            width={width} 
            height={height} 
            className={className}
            {...props}
        />
    );
};
