# KanbanFlow

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

For features like "Forgot Password" and email notifications to work, you must configure your Firebase project and your deployment environment.

### 1. Configure Firebase for Password Resets

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`kanban-b3129`).
3.  In the left-hand navigation, go to **Build > Authentication**.
4.  Click on the **Templates** tab.
5.  Select the **Password reset** template from the list.
6.  Ensure the template is customized and saved. You can use the default settings.
7.  Click **Save**.

### 2. Configure Resend for Sending Emails

This application uses [Resend](https://resend.com/) to send emails for ticket assignments and tests.

1.  **Get a Resend API Key:**
    *   Sign up for a free account at [Resend](https://resend.com/).
    *   Navigate to the [API Keys](https://resend.com/api-keys) section in your dashboard.
    *   Click **"Create API Key"**. Give it a name (e.g., "KanbanFlow App") and set the permission to **"Full access"**.
    *   Copy the generated API key immediately. You will not be able to see it again.

2.  **Verify Your Domain (Recommended):**
    *   To send emails from your own domain (e.g., `notifications@yourdomain.com`), you must add and verify it in the [Domains](https://resend.com/domains) section of Resend.
    *   This is required for production use and improves email deliverability. For initial testing, you can send from `onboarding@resend.dev`.

3.  **Set Environment Variable:** You must set the `RESEND_API_KEY` environment variable.
    *   **For local development:** Create or open the `.env` file in the root of your project and add the line:
        ```
        RESEND_API_KEY=your_new_api_key_here
        ```
    *   **For production (Vercel, Firebase App Hosting, etc.):** Add `RESEND_API_KEY` to the environment variable settings in your hosting provider's dashboard.

After these configurations, the email features should work correctly. If you get an "API key is invalid" error, the most common solution is to generate a new key.

## Deployment to Firebase App Hosting

This project is configured for easy deployment on Firebase App Hosting. Follow these steps to get your application live.

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).
2.  **Firebase CLI**: You'll need the Firebase Command Line Interface (CLI). If you don't have it, install it globally by running this command in your terminal:
    ```bash
    npm install -g firebase-tools
    ```

### Step-by-Step Guide

1.  **Login to Firebase**:
    Open your terminal and log in to your Firebase account. This will open a browser window for you to authenticate.
    ```bash
    firebase login
    ```

2.  **Initialize Firebase in Your Project**:
    Navigate to your project's root directory in the terminal. Since your project is already configured, you just need to link it to your Firebase project on the cloud. Run:
    ```bash
    firebase init hosting
    ```
    - When prompted, select **"Use an existing project"** and choose `kanban-b3129` from the list.
    - It will detect your `firebase.json` and `apphosting.yaml` files. Confirm that you want to proceed with App Hosting.

3.  **Deploy Your Application**:
    Once the initialization is complete, you can deploy your application with a single command:
    ```bash
    firebase deploy
    ```

The CLI will build your Next.js application and upload it to Firebase App Hosting. After a few moments, it will provide you with a URL where your live application can be accessed.

It has been a pleasure building this with you! Congratulations on creating a complete application.
