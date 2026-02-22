FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Открываем порт 3000
EXPOSE 3000

# Запускаем dev сервер на порту 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]



