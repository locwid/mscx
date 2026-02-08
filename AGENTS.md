# AGENTS.md - mscx

## Общее описание

mscx - full-stack PWA-приложение для управления коллекциями аудиозаписей с офлайн-режимом. Приложение поддерживает загрузку треков, управление плейлистами, воспроизведение аудио и синхронизацию данных между клиентом и сервером.

## Технологический стек

### Клиент (Frontend)
- **Фреймворк**: Nuxt.js 4.2.2 (SPA mode, SSR отключен)
- **UI библиотека**: @nuxt/ui 4.3.0
- **Управление состоянием**: Pinia 3.0.4 (@pinia/nuxt)
- **База данных клиента**: Dexie 4.2.1 (IndexedDB wrapper)
- **PWA**: @vite-pwa/nuxt 1.1.0 с Workbox
- **Стилизация**: Tailwind CSS (через @nuxt/ui)
- **Утилиты**: @vueuse/core 14.1.0, @vueuse/nuxt
- **Роутинг**: vue-router (hash mode)
- **Валидация**: Zod 4.2.1
- **ID генерация**: nanoid 5.1.6
- **Валидаторы**: typescript 5.6.3
- **Иконки**: @iconify-json/lucide 1.2.83

### Сервер (Backend)
- **Язык**: Go 1.24+
- **Фреймворк**: echo v5
- **База данных**: SQLite через GORM
- **Валидация**: go-playground/validator v10
- **Конфигурация**: environment variables

## Архитектура

### Общая структура

```
/Users/ethcc/Projects/PET_PROJECTS/mscx/
├── cmd/
│   └── server/
│       └── main.go          # Точка входа сервера
├── internal/                 # Go backend
│   ├── config/              # Конфигурация приложения
│   │   └── config.go
│   ├── controller/          # HTTP обработчики
│   │   ├── track.go        # Контроллер треков
│   │   └── playlist.go     # Контроллер плейлистов
│   ├── database/
│   │   ├── database.go     # Инициализация БД
│   │   └── models/
│   │       └── models.go   # GORM модели
│   ├── dto/                # Data Transfer Objects
│   │   ├── track.go
│   │   └── playlist.go
│   └── utils/
│       └── validator.go    # Кастомный валидатор
├── web/                     # Nuxt frontend
│   ├── app/
│   │   ├── components/      # Vue компоненты
│   │   │   ├── player/     # Плеер
│   │   │   ├── playlist/   # Плейлисты
│   │   │   └── track/      # Треки
│   │   ├── pages/          # Страницы приложения
│   │   │   ├── index.vue   # Главная (все треки)
│   │   │   ├── playlists/
│   │   │   └── auth.vue    # Страница авторизации
│   │   ├── stores/         # Pinia хранилища
│   │   ├── composables/    # Vue composables
│   │   ├── utils/          # Утилиты
│   │   └── layouts/        # Layout компоненты
│   └── nuxt.config.ts      # Конфигурация Nuxt
├── _data/                   # Директория данных SQLite
├── dist/                    # Сборка production
├── Makefile                 # Команды сборки
└── README.md
```

### Backend Архитектура

#### Слои
1. **Controller Layer** (`internal/controller/`)
   - Обрабатывает HTTP запросы
   - Валидация входных данных через DTO
   - Использует echo.Context для работы с запросами
   - Возвращает JSON ответы или файлы

2. **Service/Database Layer** (`internal/database/`)
   - GORM для ORM
   - SQLite для хранения
   - Generic функции через `gorm.G[T]`

3. **Models** (`internal/database/models/`)
   - Структуры данных для GORM
   - Поля: `ID`, `Name`, `Size`, `Duration`, `Type`, `CreatedAt`

4. **DTO** (`internal/dto/`)
   - Структуры для валидации входных данных
   - Теги `validate:"required"` и т.д.

#### Контроллеры

**TrackController** (`/api/track`):
- `GET /` - получить список всех треков
- `POST /` - создать/обновить трек (с загрузкой файла)
- `DELETE /:id` - удалить трек и его файл
- `GET /:id/file` - получить аудио файл

**PlaylistController** (`/api/playlist`):
- `GET /` - получить список плейлистов
- `POST /` - создать плейлист
- `DELETE /:id` - удалить плейлист
- `POST /:id/track/:trackId` - добавить трек в плейлист
- `DELETE /:id/track/:trackId` - удалить трек из плейлиста

### Frontend Архитектура

#### Структура Nuxt приложения
- **SSR**: отключен (`ssr: false`)
- **Режим роутера**: hash mode
- **Стиль страниц**: SPA с PWA

#### Компоненты

**Организация по функциям**:
- `components/player/` - плеер компоненты
- `components/playlist/` - плейлисты
- `components/track/` - треки

**Основные компоненты**:
- `the-header.vue` - шапка приложения
- `the-sidebar.vue` - боковое меню
- `player/floating.vue` - плавающий плеер
- `track/list.vue` - список треков с виртуализацией
- `track/list-row.vue` - строка трека
- `playlist/list.vue` - список плейлистов
- `playlist/list-row.vue` - строка плейлиста
- `playlist/info.vue` - информация о плейлисте
- `playlist/create.vue` - создание плейлиста
- `playlist/picker.vue` - выбор плейлиста

#### Хранилища (Pinia)

**use-player.ts** - управление плеером:
- `currentTrackId`, `currentPlaylistId` - текущий трек/плейлист
- `tracks` - реактивный запрос треков через Dexie
- Функции: `startPlayList`, `stopPlaylist`, `switchToNextTrack`

**use-auth.ts** - авторизация:
- Хранение auth токена
- Проверка авторизации

**use-app.ts** - глобальное состояние:
- `isSyncing` - флаг синхронизации
- `syncError` - ошибки синхронизации
- `isOnline` - статус сети

#### Composables

**use-dexie-live-query.ts**:
- Реактивные запросы к IndexedDB через Dexie
- Интеграция с RxJS для реактивности

**use-server-sync.ts**:
- Синхронизация с сервером с debounce (1000ms)
- Автоматическая синхронизация при появлении сети
- Ручной вызов синхронизации

**use-track-file.ts**:
- Управление файлами треков (загрузка/удаление)
- Работа с IndexedDB для хранения бинарных данных

#### Страницы

- `/` - главная, все треки
- `/playlists` - список плейлистов
- `/playlists/:id` - детали плейлиста
- `/auth` - авторизация

## PWA и Офлайн-режим

### Особенности
- **Service Worker**: generateSW стратегия
- **Кэширование**: `globPatterns: ['**/*.{js,css,html,png,svg,ico,woff}']`
- **Навигация**: `navigateFallback: '/'`
- **Обновление**: autoUpdate

### Офлайн функционал
1. **Dexie/IndexedDB** хранит все метаданные треков и плейлистов
2. **Track файлы** могут быть загружены для офлайн прослушивания
3. **Синхронизация** при появлении сети:
   - Отслеживание `navigator.onLine`
   - Автоматическая синхронизация при online событии
   - Debounced синхронизация (1 сек)

### Манифест
- `name`: mscx
- `display`: standalone
- `orientation`: portrait
- `theme_color`: #000000

## Code Style

### Go (Backend)

#### Общие правила
- **Пакеты**: lowercase, краткие имена
- **Структуры**: PascalCase для экспортируемых, camelCase для внутренних
- **Интерфейсы**: суффикс `-er` (например, `TrackController`)
- **Конструкторы**: `Make` префикс (например, `MakeTrackController`)
- **Ошибки**: использование `echo.ErrBadRequest`, `echo.ErrNotFound`, `echo.ErrInternalServerError`

#### Импорты
Группировка:
1. Стандартные библиотеки
2. Внешние зависимости
3. Внутренние пакеты проекта

```go
import (
    "context"
    "fmt"
    
    "github.com/labstack/echo/v5"
    "gorm.io/gorm"
    
    "github.com/locwid/mscx/internal/config"
)
```

#### Обработка ошибок
- Всегда проверяйте ошибки
- Возвращайте HTTP ошибки через echo
- Используйте `.Wrap(err)` для оборачивания

```go
if err != nil {
    return echo.ErrBadRequest.Wrap(err)
}
```

#### Структура контроллера
```go
type TrackController interface {
    Create(c *echo.Context) error
    GetList(c *echo.Context) error
    // ...
}

type trackController struct {
    db *gorm.DB
}

func MakeTrackController(db *gorm.DB) TrackController {
    return trackController{db}
}
```

### TypeScript/Vue (Frontend)

#### Общие правила
- **Компоненты**: PascalCase для имен файлов (например, `TrackList.vue`)
- **Сторы**: kebab-case с префиксом `use-` (например, `use-player.ts`)
- **Composables**: kebab-case с префиксом `use-`
- **Утилиты**: kebab-case

#### Prettier конфигурация
```json
{
  "semi": false,
  "singleQuote": true
}
```

#### Vue SFC структура
```vue
<script lang="ts" setup>
// imports
// types/interfaces
// props/emits
// composables
// reactive state
// computed
// methods
// watchers
// lifecycle
</script>

<template>
  <!-- template -->
</template>
```

#### Импорты в Vue
- Используйте `~/` alias для импортов из корня проекта
- Группируйте: Vue/Nuxt, библиотеки, локальные модули

```typescript
import { ref, computed } from 'vue'
import { useVirtualList } from '@vueuse/core'
import type { Track } from '~/dexie.storage'
```

#### Стилизация
- Используйте классы Tailwind CSS
- Цвета через тему @nuxt/ui
- Размеры: `xl` по умолчанию (в nuxt.config)
- Иконки: `i-lucide-{name}`

#### Работа с состоянием
- Используйте `defineStore` из Pinia
- Разделяйте состояние и методы
- Экспортируйте readonly для внутреннего состояния

```typescript
export const usePlayer = defineStore('player', () => {
  const currentTrackId = ref<string | null>(null)
  
  function switchToNextTrack() {
    // logic
  }
  
  return {
    currentTrackId: readonly(currentTrackId),
    switchToNextTrack,
  }
})
```

#### Именование в компонентах
- Props: camelCase в defineProps, kebab-case в template
- Emits: camelCase
- Refs/reactive: camelCase, описательные имена

#### Обработка событий
- Используйте `@click`, `@submit` и т.д.
- Обработчики: глагол + действие (например, `handleSubmit`, `startPlayList`)

## Разработка

### Установка зависимостей
```bash
# Клиент
cd web && bun install

# Сервер
go mod tidy
```

### Запуск development
```bash
make dev
```
Клиент: http://localhost:3000
Сервер: http://localhost:4000 (или из .env)

### Сборка production
```bash
make package
```

### Форматирование кода
```bash
# Frontend
cd web && bun run format

# Backend
go fmt ./...
```

## API Endpoints

Все API endpoints требуют авторизации через header `Authorization: {authKey}` или query параметр `?authKey={authKey}`.

### Tracks
- `GET /api/track` - список треков
- `POST /api/track` - создание/обновление
- `DELETE /api/track/:id` - удаление
- `GET /api/track/:id/file` - получение файла

### Playlists
- `GET /api/playlist` - список плейлистов
- `POST /api/playlist` - создание
- `DELETE /api/playlist/:id` - удаление
- `POST /api/playlist/:id/track/:trackId` - добавить трек
- `DELETE /api/playlist/:id/track/:trackId` - удалить трек

## Безопасность

- Аутентификация через Authorization header/query param
- Валидация входных данных через go-playground/validator
- Разделение API и статики (middleware)
- Graceful shutdown сервера

## Конфигурация

Переменные окружения (Makefile):
- `SERVER_PORT` - порт сервера (default: 4000)
- `DB_PATH` - путь к SQLite (default: ./_data/)
- `AUTH_KEY` - ключ авторизации

Nuxt config:
- hash mode роутинг для PWA
- proxy для API в development
- PWA настройки с Workbox
