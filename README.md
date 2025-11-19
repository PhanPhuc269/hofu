# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
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

## Backend / API setup

This project includes a small fetch-based API client at `services/api.ts`.

- The client reads a base URL from your Expo config `extra.API_BASE_URL` (see `app.json` / `app.config.*`) or falls back to `http://localhost:3000`.
- In development, you can override the base URL at runtime with `setBaseUrl()` exported from `services/api`.
- To include an auth token for requests, call `setAuthToken(token)`.

Example usage in code:

```ts
import api from "@/services/api";

api.setBaseUrl("http://10.0.2.2:3000"); // Android emulator
api.setAuthToken("your-jwt-token");

const me = await api.request("/me");
```

The `services/userRepository.ts` file is wired to use the client for `fetchCurrentUser` and `saveUser` — adapt endpoints to match your backend.
