# Beluga - Social Media App

Beluga is a social media application built with React Native and Firebase, allowing users to create profiles, share posts with images, follow friends, like and comment on posts.

## Features

- User authentication (sign up, sign in, sign out)
- Profile creation and editing
- Post creation with text and multiple images
- Like and comment on posts
- Follow/unfollow other users
- Real-time updates for posts, likes, and comments
- Image upload and storage

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

For mobile development:

- [Expo Go](https://expo.dev/client) app installed on your iOS or Android device
- Alternatively, iOS Simulator (macOS) or Android Emulator

## Installation

1. Clone the repository

```bash
git clone https://github.com/Joshnomnom/Beluga.git
cd beluga
```

2. Install dependencies

```bash
npm install
```

3. Create necessary directories

```bash
mkdir -p src/assets
```

4. Set up Firebase

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore Database, and Storage
   - Set up Firestore security rules as specified in the project
   - Update the Firebase configuration in `src/services/FirebaseConfig.ts` if needed

5. Configure Firestore Security Rules
   - Go to Firebase Console > Firestore Database > Rules
   - Update the rules to allow authenticated users to read/write data

## Environment Variables (.env)

1. Copy the example file and fill in your values:

   - Windows (PowerShell): `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`

2. Edit `.env` and set the following variables:

   Firebase

   - FIREBASE_API_KEY=
   - FIREBASE_AUTH_DOMAIN=
   - FIREBASE_PROJECT_ID=
   - FIREBASE_STORAGE_BUCKET=
   - FIREBASE_MESSAGING_SENDER_ID=
   - FIREBASE_APP_ID=
   - FIREBASE_MEASUREMENT_ID=

   Cloudinary

   - CLOUDINARY_CLOUD_NAME=
   - CLOUDINARY_UPLOAD_PRESET=

3. After changing env values, restart Expo with cache clear so the app picks them up:
   - `npx expo start -c`

Security notes

- `.env` is git-ignored by default and should never be committed.
- If you accidentally committed secrets, rotate them in Firebase/Cloudinary and purge them from git history. See:
  - GitHub guide: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
  - BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/

## Running the App

1. Start the development server

```bash
npx expo start
```

2. Run on a device or emulator:
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)
   - Press 'a' in the terminal to open on Android emulator
   - Press 'i' in the terminal to open on iOS simulator

## Troubleshooting

- If you encounter the error "ENOENT: no such file or directory, watch 'src/assets'", make sure you've created the directory as mentioned in step 3 of installation.
- For Firebase permission errors, check your Firestore security rules.
- If you have issues with image uploads, ensure Firebase Storage is properly configured.
- If you see "Unable to resolve module @env", ensure `module:react-native-dotenv` is in `babel.config.js` and restart with `npx expo start -c`.
- Cloudinary upload errors (400/401): verify `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET`, and that the preset exists and is set to unsigned in Cloudinary > Settings > Upload.
- Env changes not picked up: ensure there are no quotes around values, no trailing spaces, and you restarted the dev server with cache clear.

## Project Structure

- `/src/components` - Reusable UI components
- `/src/screens` - Application screens
- `/src/services` - Firebase configuration and services
- `/assets` - Static assets like images and icons

## Technologies Used

- React Native
- Expo
- Firebase (Authentication, Firestore, Storage)
- React Navigation
- Expo Image Picker
