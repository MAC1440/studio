# BoardRLane

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
