# 🎨 Как заменить иконки на свои

## 📍 Где находятся иконки:

### 1. **Логотип (4 точки)**
- Файл: `components/header/Header.jsx` (строки 9-14)
- Файл: `components/footer/Footer.jsx` (аналогично)

### 2. **Иконка входа (замок)**
- Файл: `components/header/Header.jsx` (строки 33-35)

### 3. **Иконка поиска**
- Файл: `components/header/Header.jsx` (строки 25-28)

---

## 🔧 Способ 1: Заменить SVG код напрямую (САМЫЙ ПРОСТОЙ)

### Пример для логотипа:

1. Откройте `components/header/Header.jsx`
2. Найдите блок с логотипом (строки 9-14)
3. Замените на свой SVG:

```jsx
// БЫЛО:
<div className={style.logoDots}>
    <span className={style.dot}></span>
    <span className={style.dot}></span>
    <span className={style.dot}></span>
    <span className={style.dot}></span>
</div>

// СТАЛО (ваш SVG):
<svg width="32" height="32" viewBox="0 0 32 32">
    {/* Вставьте сюда код вашего SVG логотипа */}
    <path d="..." fill="#3b82f6"/>
</svg>
```

### Пример для иконки входа:

```jsx
// БЫЛО (строки 33-35):
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1V8M8 8L5 5..." stroke="currentColor"/>
</svg>

// СТАЛО (ваш SVG):
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {/* Вставьте код вашей иконки */}
</svg>
```

---

## 🖼️ Способ 2: Использовать PNG/JPG изображения

1. Положите файл в `public/icons/` или `src/assets/icons/`
2. Используйте как обычное изображение:

```jsx
// Если в public/icons/
<img src="/icons/my-logo.png" alt="Logo" width={32} height={32} />

// Если в src/assets/icons/
import logoImg from '../../assets/icons/my-logo.png';
<img src={logoImg} alt="Logo" width={32} height={32} />
```

---

## 📦 Способ 3: Использовать готовые компоненты иконок

Я создал файл `src/components/icons/SimpleIcon.jsx` с готовыми компонентами.

1. Откройте `SimpleIcon.jsx`
2. Замените SVG код внутри компонента на свой
3. Используйте в Header:

```jsx
import { LogoIcon, LoginIcon } from '../icons/SimpleIcon';

// В компоненте:
<LogoIcon width={32} height={32} />
<LoginIcon width={16} height={16} />
```

---

## 💡 Рекомендации:

- **Для простых иконок**: Используйте Способ 1 (замена SVG кода)
- **Для сложных логотипов**: Используйте Способ 2 (PNG/JPG)
- **Для переиспользования**: Используйте Способ 3 (компоненты)

## 🎯 Быстрый старт:

1. Откройте `components/header/Header.jsx`
2. Найдите `<svg>` теги
3. Замените содержимое на свой SVG код
4. Готово! ✨

