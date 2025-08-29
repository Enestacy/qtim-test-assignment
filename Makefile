# Переменные
NODE_ENV ?= development
COMPOSE_FILE = docker-compose.yaml
PROJECT_NAME := qtim
ENV_FILE = .env.$(NODE_ENV).local

RUN := run --rm
DOCKER_COMPOSE := docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) --project-name $(PROJECT_NAME)
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
	@echo "$(GREEN)Перезапуск контейнеров с пересборкой...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache --force-rm
	$(MAKE) recreate
	@echo "$(GREEN)Контейнеры пересобраны и запущены!$(NC)"

test-unit:
	@echo "$(GREEN)Запуск unit тестов...$(NC)"
	$(DOCKER_COMPOSE_RUN) -e "NODE_ENV=test" app npm run test -- --forceExit --detectOpenHandles
	@echo "$(GREEN)Тесты завершены!$(NC)"

test-e2e:
	@echo "$(GREEN)Запуск e2e тестов...$(NC)"
	$(DOCKER_COMPOSE_RUN) -e "NODE_ENV=test" app npm run test:e2e -- --forceExit --detectOpenHandles
	@echo "$(GREEN)Тесты завершены!$(NC)"

test: test-unit test-e2e

migrate:
	$(DOCKER_COMPOSE_RUN) -e "NODE_ENV=development" app npm run migration:up
	$(DOCKER_COMPOSE_RUN) -e "NODE_ENV=test" app npm run migration:up

migrate-down:
	$(DOCKER_COMPOSE_RUN) -e "NODE_ENV=development" app npm run migration:down
	$(DOCKER_COMPOSE_RUN) -e "NODE_ENV=test" app npm run migration:down

migration-create:
	$(DOCKER_COMPOSE_RUN) app npm run typeorm migration:create ./db/migrations/$(name)
