.PHONY: up down logs status test-backend build-frontend

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f backend frontend mongodb

status:
	docker compose ps

test-backend:
	cd backend && mvn test

build-frontend:
	cd frontend && npm install && npm run build
