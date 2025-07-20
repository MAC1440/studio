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

## Important: Enabling Forgot Password Emails

For the "Forgot Password" feature to work, you must configure the email template in your Firebase project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`kanban-b3129`).
3.  In the left-hand navigation, go to **Build > Authentication**.
4.  Click on the **Templates** tab.
5.  Select the **Password reset** template from the list.
6.  By default, you might see a message asking you to customize the template. You can simply use the default settings or customize the sender name and message.
7.  Ensure the **email address link** shown in the template editor is valid and points to your application.
8.  Click **Save**.

After saving the template, the password reset emails should be sent successfully. Check your spam folder if you don't see them immediately.

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
