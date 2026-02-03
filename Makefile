.PHONY: help build up down logs clean test prod-build prod-up prod-down

help:
	@echo "Commandes disponibles:"
	@echo "  make build       - Build les images Docker"
	@echo "  make up          - Demarrer les conteneurs en dev"
	@echo "  make down        - Arreter les conteneurs"
	@echo "  make logs        - Voir les logs"
	@echo "  make clean       - Nettoyer les volumes"
	@echo "  make test        - Lancer les tests"
	@echo "  make prod-build  - Build pour production"
	@echo "  make prod-up     - Demarrer en production"
	@echo "  make prod-down   - Arreter la production"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-mongodb:
	docker-compose logs -f mongodb

clean:
	docker-compose down -v
	docker system prune -f

test:
	docker-compose exec backend npm run test

prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

ps:
	docker-compose ps

restart:
	docker-compose restart

restart-backend:
	docker-compose restart backend

shell-backend:
	docker-compose exec backend sh

shell-mongodb:
	docker-compose exec mongodb mongosh -u admin -p admin123
