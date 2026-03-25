.PHONY: ruff_fix ruff_check test-fetcher test-all build_dev start_dev stop_dev test-backend test-backend-unit test-backend-integration test-backend-e2e test-backend-cov test-frontend test-frontend-cov

ruff_fix:
	ruff check --fix . && \
	ruff check --fix --select I . && \
	ruff format .

ruff_check:
	ruff check . && \
	ruff check --select I . && \
	ruff format --check .

test-fetcher:
	docker compose -f compose-test.yml run --build --rm fetcher-tests

test-all:
	docker compose -f compose-test.yml build
	docker compose -f compose-test.yml run --rm backend-tests
	docker compose -f compose-test.yml run --rm frontend-tests

build_dev:
	docker compose build

start_dev:
	docker compose up -d

stop_dev:
	docker compose down

test-backend:
	cd backend && python -m pytest

test-backend-unit:
	cd backend && python -m pytest -m unit

test-backend-integration:
	cd backend && python -m pytest -m integration

test-backend-e2e:
	cd backend && python -m pytest -m e2e

test-backend-cov:
	cd backend && python -m pytest --cov=src --cov-config=.coveragerc --cov-report=term-missing

test-frontend:
	cd frontend && npm test

test-frontend-cov:
	cd frontend && npm run test -- --coverage
