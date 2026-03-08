# Live Performance Landing

Лендинг для музыканта + админка для управления контентом.

## Что внутри

- Лендинг:
  - Header с навигацией
  - Hero блок
  - Блок с музыкой (YouTube превью)
  - Блок с фото-галереей
  - Footer с контактами и копирайтом
- Админка (`/admin`):
  - Редактирование hero-контента
  - Управление треками (YouTube ссылки)
  - Загрузка фото в Cloudinary
  - Редактирование контактов

## Технологии

- React + TypeScript + Vite
- React Router
- Firebase Firestore (контент)
- Cloudinary (изображения)

## Настройка

1. Установить зависимости:

```bash
npm install
```

2. Создать файл `.env` на основе `.env.example`.

3. Заполнить переменные Firebase и Cloudinary:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

4. Запуск разработки:

```bash
npm run dev
```

5. Production build:

```bash
npm run build
```

## Структура данных Firestore

Документ: `landing/main`

Содержит:
- artistName
- heroTitle
- heroSubtitle
- heroImageUrl
- heroImagePositionX
- heroImagePositionY
- navItems[]
- tracks[]
- gallery[]
- contacts

## Deploy на Firebase Hosting через GitHub Actions

Workflow: `.github/workflows/firebase-hosting-deploy.yml`

Деплой запускается:
- при `push` в ветку `main_git`
- вручную через `workflow_dispatch`

Нужно добавить в GitHub Secrets:

- `FIREBASE_SERVICE_ACCOUNT_MY_DIGITAL_PROFILE_E9F92`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Firebase проект задан в `.firebaserc` как `my-digital-profile-e9f92`.
