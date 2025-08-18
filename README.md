
# BoardR

This is a Next.js application built with Firebase Studio. It features a fully functional Kanban board with user authentication, ticket management, and an admin panel, all integrated with Firebase.

## Getting Started

To run the application locally, first install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Environment Variables

This project requires certain environment variables to be set to connect to Firebase services.

### Client-Side Variables

These are needed for the app to function in the browser. Create a file named `.env` in the root of your project and add the following variables from your Firebase project settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# The public URL of your deployed application
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### Server-Side (Admin) Variables

These are required for backend actions like creating and deleting users from a secure server environment. **These should not be prefixed with `NEXT_PUBLIC_`**.

```
# Get this from your Google Cloud / Firebase project settings.
GEMINI_API_KEY=your_gemini_api_key

# --- Firebase Admin SDK Credentials ---
# These are required for super-admin actions.
# Go to Firebase Console > Project Settings > Service Accounts.
# Click "Generate new private key" to get a JSON file.

# The `client_email` from your service account JSON file.
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...

# The `private_key` from your service account JSON file.
# IMPORTANT: Copy the entire key, including "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----".
# In your .env file, format it as a single line, replacing newlines with `\n`.
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```
**Important**: When deploying to a service like Vercel, you must set all of these environment variables in your project's settings dashboard. For the `NEXT_PUBLIC_APP_URL` on Vercel, use your full production URL (e.g., `https://your-app.vercel.app`).


## Important: Enabling Email Features

For features like "Forgot Password" and email notifications to work, you must configure your Firebase project.

### Configure Firebase for Password Resets

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`kanban-b3129`).
3.  In the left-hand navigation, go to **Build > Authentication**.
4.  Click on the **Templates** tab.
5.  Select the **Password reset** template from the list.
6.  Ensure the template is customized and saved. You can use the default settings.
7.  Click **Save**.

This project uses a service called **Resend** to send some email notifications. If you wish to enable this, you will need to create a Resend account, generate an API key, and add it as an environment variable named `RESEND_API_KEY`.

## Deployment to Vercel

This project is configured for easy deployment on Vercel.

The application is already live at: [https://boardr.vercel.app](https://boardr.vercel.app)

To deploy your own version, you can use the Vercel platform. After connecting your Git repository to Vercel, it will automatically build and deploy your application upon every push to the `master` branch. You will also need to add all the required environment variables to your Vercel project settings.

