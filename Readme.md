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
