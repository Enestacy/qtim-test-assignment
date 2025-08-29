# Переменные
COMPOSE_FILE = docker-compose.yaml
PROJECT_NAME := qtim

RUN := run --rm
DOCKER_COMPOSE := docker-compose -f $(COMPOSE_FILE) --project-name $(PROJECT_NAME)
DOCKER_COMPOSE_RUN := $(DOCKER_COMPOSE) $(RUN)

GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

provision: rebuild install start
install:
	@echo "$(GREEN)Установка зависимостей...$(NC)"
	$(DOCKER_COMPOSE_RUN) app npm install
	@echo "$(GREEN)Зависимости установлены!$(NC)"

start:
	@echo "$(GREEN)Запуск контейнеров...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Контейнеры запущены!$(NC)"

stop:
	@echo "$(YELLOW)Остановка контейнеров...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)Контейнеры остановлены!$(NC)"

recreate: 
	@echo "$(GREEN)Перезапуск контейнеров...$(NC)"
	$(DOCKER_COMPOSE) up -d --force-recreate
	@echo "$(GREEN)Контейнеры перезапущены!$(NC)"

clean:
	@echo "$(RED)Полная очистка...$(NC)"
	$(DOCKER_COMPOSE) down -v
	@echo "$(GREEN)Очистка завершена!$(NC)"

rebuild: stop
	@echo "$(GREEN)Пересоздание контейнеров...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache --force-rm
	@echo "$(GREEN)Контейнеры пересозданы!$(NC)"

test-unit:
	@echo "$(GREEN)Запуск unit тестов...$(NC)"
	NODE_ENV=test $(DOCKER_COMPOSE_RUN) app npm run test -- --forceExit --detectOpenHandles
	@echo "$(GREEN)Тесты завершены!$(NC)"

test-e2e:
	@echo "$(GREEN)Запуск e2e тестов...$(NC)"
	NODE_ENV=test $(DOCKER_COMPOSE_RUN) app npm run test:e2e -- --forceExit --detectOpenHandles
	@echo "$(GREEN)Тесты завершены!$(NC)"

test: test-unit test-e2e

migrate:
	NODE_ENV=development $(DOCKER_COMPOSE_RUN) app npm run migration:up
	NODE_ENV=test $(DOCKER_COMPOSE_RUN) app npm run migration:up

migrate-down:
	NODE_ENV=development $(DOCKER_COMPOSE_RUN) app npm run migration:down
	NODE_ENV=test $(DOCKER_COMPOSE_RUN) app npm run migration:down

migration-create:
	$(DOCKER_COMPOSE_RUN) app npm run typeorm migration:create ./db/migrations/$(name)
