# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project (ushtro-mobile) that uses the same Supabase backend as the [ushtro](https://github.com/egzidev/ushtro) Next.js app.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. **Supabase env** – Copy `.env.example` to `.env` and set your Supabase URL and anon key (same as the Next.js app):

   ```bash
   cp .env.example .env
   # Edit .env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
   ```

3. Start the app

   ```bash
   npx expo start
   ```

   Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Push to GitHub (run once)

From the project root:

```bash
git init
git add .
git commit -m "Initial commit: Expo app with Supabase client"
git remote add origin https://github.com/egzidev/ushtro-mobile.git
git branch -M main
git push -u origin main
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
