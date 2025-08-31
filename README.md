# QTim Test Assignment

## Требования

* [Docker & Docker Compose](https://docs.docker.com/compose/install/)

## Документация API

Полная документация API с примерами доступна по ссылке:

**Postman Documentation:** [https://documenter.getpostman.com/view/32930910/2sB3Hhs2Z6](https://documenter.getpostman.com/view/32930910/2sB3Hhs2Z6)


## Быстрый старт

### Первый запуск

1. **Настройка переменных окружения**
   ```bash
   cp .env.development .env.development.local
   vi .env.development.local
   ```

2. **Инициализация проекта**
   ```bash
   make provision
   ```
   Эта команда автоматически:
   - Пересоберет контейнеры
   - Установит зависимости
   - Запустит приложение

### Повседневная работа

#### Запуск приложения
```bash
make start
```

#### Остановка приложения
```bash
make stop
```

#### Перезапуск контейнеров
```bash
make recreate
```

### Управление данными

#### Полная очистка (удаление всех данных)
```bash
make clean
```

#### Пересборка контейнеров
```bash
make rebuild
```

### Тестирование

#### Запуск всех тестов
```bash
make test
```

#### Unit тесты
```bash
make test-unit
```

#### End-to-end тесты
```bash
make test-e2e
```

## Важные замечания

### При смене веток

**Рекомендуется выполнить `make provision` при переключении между ветками**, особенно если:
- Изменились зависимости в `package.json`
- Обновился `Dockerfile`
- Изменились переменные окружения
- Добавились новые миграции

### Команды Makefile

| Команда | Описание |
|---------|----------|
| `make provision` | Полная инициализация проекта (rebuild + install + start) |
| `make install` | Установка зависимостей в контейнере |
| `make start` | Запуск контейнеров |
| `make stop` | Остановка контейнеров (данные сохраняются) |
| `make recreate` | Перезапуск контейнеров |
| `make clean` | Остановка и удаление всех данных |
| `make rebuild` | Пересборка контейнеров с нуля |
| `make test` | Запуск всех тестов (unit + e2e) |
| `make test-unit` | Запуск unit тестов |
| `make test-e2e` | Запуск end-to-end тестов |
