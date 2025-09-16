# Moto Transport

Une plateforme complète de transport à moto construite avec un monorepo Turborepo.

## 🏗️ Architecture

Ce projet utilise un monorepo avec Turborepo pour gérer plusieurs applications :

### Applications

- **`web`** - Application web principale (Next.js)
- **`admin`** - Interface d'administration (Next.js)
- **`mobile`** - Application mobile (React Native)
- **`docs`** - Documentation du projet (Next.js)
- **`backend`** - API Backend (NestJS + TypeORM + PostgreSQL)

### Packages partagés

- **`@repo/ui`** - Composants UI partagés
- **`@repo/eslint-config`** - Configuration ESLint
- **`@repo/typescript-config`** - Configuration TypeScript

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- pnpm (recommandé)
- Docker (pour PostgreSQL)

### Installation

```bash
# Installer les dépendances
pnpm install

# Démarrer la base de données PostgreSQL
cd docker/postgres
docker-compose up -d

# Démarrer toutes les applications en mode développement
pnpm dev
```

### Commandes disponibles

```bash
# Développement
pnpm dev                    # Démarrer toutes les apps
pnpm dev --filter=web       # Démarrer seulement l'app web
pnpm dev --filter=admin     # Démarrer seulement l'app admin
pnpm dev --filter=backend   # Démarrer seulement le backend

# Build
pnpm build                  # Build toutes les apps
pnpm build --filter=web     # Build seulement l'app web

# Linting
pnpm lint                   # Linter toutes les apps
pnpm lint --filter=backend  # Linter seulement le backend

# Tests
pnpm test                   # Tests de toutes les apps
pnpm test --filter=backend  # Tests seulement du backend
```

## 📱 Applications

### Web App (`apps/web`)
- **Port**: 3000
- **Description**: Interface utilisateur principale
- **Tech**: Next.js 15, TypeScript, Tailwind CSS

### Admin App (`apps/admin`)
- **Port**: 3001
- **Description**: Interface d'administration
- **Tech**: Next.js 15, TypeScript, Tailwind CSS

### Mobile App (`apps/mobile`)
- **Description**: Application mobile
- **Tech**: React Native, TypeScript

### Backend (`apps/backend`)
- **Port**: 3000
- **Description**: API REST et base de données
- **Tech**: NestJS, TypeORM, PostgreSQL

### Docs (`apps/docs`)
- **Port**: 3002
- **Description**: Documentation du projet
- **Tech**: Next.js, TypeScript

## 🗄️ Base de données

Le projet utilise PostgreSQL avec Docker :

```bash
# Démarrer PostgreSQL
cd docker/postgres
docker-compose up -d

# Arrêter PostgreSQL
docker-compose down
```

## 🛠️ Développement

### Structure du monorepo

```
moto-transport/
├── apps/
│   ├── web/          # Application web
│   ├── admin/        # Interface admin
│   ├── mobile/       # App mobile
│   ├── backend/      # API Backend
│   └── docs/         # Documentation
├── packages/
│   ├── ui/           # Composants partagés
│   ├── eslint-config/
│   └── typescript-config/
├── docker/
│   └── postgres/     # Configuration DB
└── turbo.json        # Configuration Turborepo
```

### Ajout de nouvelles fonctionnalités

1. **Backend** : Ajouter les entités, services et contrôleurs dans `apps/backend/src/`
2. **Frontend** : Créer les composants dans `packages/ui/src/` et les pages dans les apps
3. **Mobile** : Développer les écrans dans `apps/mobile/`

## 🚀 Déploiement

### Production

```bash
# Build pour la production
pnpm build

# Démarrer en production
pnpm start
```

### Variables d'environnement

Créer les fichiers `.env` dans chaque app selon les besoins :

- `apps/backend/.env` - Configuration base de données
- `apps/web/.env.local` - Configuration app web
- `apps/admin/.env.local` - Configuration app admin

## 📚 Documentation

- [Turborepo](https://turbo.build/repo/docs)
- [Next.js](https://nextjs.org/docs)
- [NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.