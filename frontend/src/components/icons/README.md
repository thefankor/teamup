# Как использовать свои иконки

## Способ 1: Заменить SVG файлы (Рекомендуется)

1. Положите свои SVG файлы в папку `src/assets/icons/`
2. Назовите файлы: `logo.svg`, `login.svg`, `search.svg` и т.д.
3. Обновите компонент `Icon.jsx`, добавив импорт вашей иконки

Пример:
```jsx
import { ReactComponent as MyLogoIcon } from '../../assets/icons/my-logo.svg';

const icons = {
    logo: MyLogoIcon,
    // ...
};
```

## Способ 2: Использовать как обычные изображения

Если у вас PNG/JPG иконки:

1. Положите файлы в `src/assets/icons/` или `public/icons/`
2. Импортируйте и используйте:

```jsx
import logoIcon from '../../assets/icons/logo.png';

<img src={logoIcon} alt="Logo" width={32} height={32} />
```

## Способ 3: Встроить SVG прямо в компонент

Откройте файл компонента (например, `Header.jsx`) и замените SVG код на свой:

```jsx
<svg width="32" height="32" viewBox="0 0 32 32">
  {/* Ваш SVG код здесь */}
</svg>
```

## Где находятся иконки:

- **Логотип**: `src/assets/icons/logo.svg`
- **Иконка входа**: `src/assets/icons/login.svg`
- **Иконка поиска**: `src/assets/icons/search.svg`

## Как использовать в компонентах:

```jsx
import { Icon } from '../icons/Icon';

// В компоненте:
<Icon name="logo" width={32} height={32} />
<Icon name="login" width={16} height={16} />
```

