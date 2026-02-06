# CI/CD Pipeline Documentation

## Overview
Ce projet utilise GitHub Actions pour l'intégration continue (CI) et le déploiement continu (CD).

## Pipelines

### CI Pipeline (`.github/workflows/ci.yml`)

Le pipeline CI s'exécute automatiquement sur :
- Push vers les branches `main`, `develop`, et toutes les branches `BOOK-*`
- Pull requests vers `main` et `develop`

#### Jobs CI

1. **Lint** 
   - Vérifie la qualité du code avec ESLint
   - Vérifie le formatage du code avec Prettier
   
2. **Test**
   - Exécute les tests unitaires
   - Génère un rapport de couverture de code
   - Upload le rapport vers Codecov (optionnel)

3. **Build**
   - Compile l'application TypeScript
   - Upload les artifacts de build
   - Dépend du succès des jobs Lint et Test

4. **Docker Build**
   - Construit l'image Docker
   - S'exécute uniquement sur `main` et `develop`
   - Utilise le cache GitHub Actions pour optimiser les builds

### CD Pipeline (`.github/workflows/cd.yml`)

Le pipeline CD gère les déploiements :

1. **Deploy to Staging**
   - Déploiement automatique sur l'environnement de staging
   - Déclenché par les push sur `main`

2. **Deploy to Production**
   - Déploiement sur l'environnement de production
   - Déclenché uniquement par les tags `v*.*.*` (exemple: v1.0.0)
   - Crée automatiquement une release GitHub

## Configuration

### Variables d'environnement requises

Pour que les pipelines fonctionnent correctement, configurez ces secrets dans GitHub :

- `CODECOV_TOKEN` : Token pour upload des rapports de couverture (optionnel)
- `GITHUB_TOKEN` : Fourni automatiquement par GitHub Actions

### Environnements GitHub

Configurez les environnements suivants dans votre repository GitHub :
- `staging` : Pour les déploiements de staging
- `production` : Pour les déploiements de production (avec protection de branche recommandée)

## Utilisation

### Exécuter les tests localement

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:cov

# Lint
npm run lint

# Format
npm run format
```

### Build local

```bash
# Build de l'application
npm run build

# Build Docker
docker build -t booknest-backend .
```

### Déclencher un déploiement

#### Staging
```bash
git push origin main
```

#### Production
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Workflow de développement recommandé

1. Créer une branche depuis `main` : `git checkout -b BOOK-XX-feature`
2. Développer et commiter les changements
3. Push la branche : `git push origin BOOK-XX-feature`
4. Le CI s'exécute automatiquement
5. Créer une Pull Request vers `main`
6. Après review et merge, le déploiement staging est automatique
7. Pour déployer en production, créer un tag de version

## Optimisations

- **Cache NPM** : Les dépendances sont mises en cache pour accélérer les builds
- **Cache Docker** : Les layers Docker sont mis en cache avec GitHub Actions Cache
- **Parallélisation** : Les jobs Lint et Test s'exécutent en parallèle
- **Artifacts** : Les builds sont sauvegardés pendant 7 jours

## Monitoring

- Consultez l'onglet "Actions" dans GitHub pour voir l'état des pipelines
- Les rapports de couverture sont disponibles sur Codecov
- Les artifacts de build peuvent être téléchargés depuis l'interface GitHub Actions
