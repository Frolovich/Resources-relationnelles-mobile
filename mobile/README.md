# (Re)Sources Relationnelles — Application Mobile

Application mobile iOS & Android développée avec **React Native** (Expo) qui se connecte au backend Symfony existant.

## Stack technique

- **React Native** via Expo SDK 52
- **TypeScript** pour la sécurité du typage
- **React Navigation** pour la navigation (tabs + stack)
- **Expo SecureStore** pour le stockage sécurisé du JWT
- **Expo ImagePicker** pour l'upload de médias

## Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Pour iOS : macOS + Xcode
- Pour Android : Android Studio + émulateur ou appareil physique

## Installation

```bash
cd mobile
npm install
```

## Lancement

```bash
# Démarrer le serveur de développement
npx expo start

# Lancer sur Android
npx expo start --android

# Lancer sur iOS
npx expo start --ios
```

## Configuration du backend

L'application se connecte automatiquement au backend selon la plateforme :
- **Android emulator** : `http://10.0.2.2:8000`
- **iOS simulator** : `http://localhost:8000`

Pour un appareil physique, modifiez `src/config/api.ts` avec l'IP locale de votre machine.

## Structure du projet

```
mobile/
├── App.tsx                    # Point d'entrée
├── src/
│   ├── config/
│   │   └── api.ts             # Configuration API (URLs)
│   ├── context/
│   │   └── AuthContext.tsx     # Contexte d'authentification global
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Navigation racine
│   │   ├── AuthNavigator.tsx   # Stack login/register
│   │   └── MainTabNavigator.tsx # Tabs principales
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Liste des ressources
│   │   ├── ResourceDetailScreen.tsx # Détail + commentaires
│   │   ├── CreateResourceScreen.tsx # Upload de ressource
│   │   ├── FavoritesScreen.tsx # Favoris utilisateur
│   │   ├── ProfileScreen.tsx   # Profil + déconnexion
│   │   ├── LoginScreen.tsx     # Connexion
│   │   ├── RegisterScreen.tsx  # Inscription
│   │   └── ForgotPasswordScreen.tsx # Mot de passe oublié
│   └── services/
│       ├── authService.ts      # Auth (login, register, JWT)
│       ├── resourceService.ts  # Ressources (CRUD, upload)
│       └── favoriteService.ts  # Favoris
├── assets/                     # Icônes et splash screen
├── app.json                    # Configuration Expo
└── package.json
```

## Fonctionnalités

### Visiteur (non connecté)
- Parcourir les ressources publiques
- Rechercher et filtrer par catégorie/type
- Voir le détail d'une ressource

### Citoyen (connecté)
- Toutes les fonctionnalités visiteur
- Créer un compte / se connecter
- Publier des ressources (photo/vidéo)
- Commenter les ressources
- Ajouter/retirer des favoris
- Voir son profil

## Build pour production

```bash
# Build Android (APK/AAB)
npx expo build:android
# ou avec EAS Build
npx eas build --platform android

# Build iOS (IPA)
npx expo build:ios
# ou avec EAS Build
npx eas build --platform ios
```

## API Endpoints utilisés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/login` | POST | Connexion JWT |
| `/api/register` | POST | Inscription |
| `/api/me` | GET | Profil utilisateur |
| `/api/public/resources` | GET | Liste des ressources |
| `/api/public/resources/{id}` | GET | Détail ressource |
| `/api/categories` | GET | Catégories |
| `/api/resources/upload` | POST | Upload média |
| `/api/comment/create` | POST | Créer commentaire |
| `/api/favorites` | GET | Liste favoris |
| `/api/favorites/{id}` | POST/DELETE | Ajouter/retirer favori |
| `/api/password/request` | POST | Demande reset mot de passe |
