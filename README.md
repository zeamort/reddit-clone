# Reddit Clone

A minimal Reddit clone built with React and TypeScript, using Clerk for authentication and Convex for the backend.

## Features

- Create communities and posts  
- Upload images to posts  
- Comment on posts  
- View posts by user  
- Search for communities or posts within a community  
- Upvote and downvote posts

## Setup & Run
You'll need to register with [Clerk](https://clerk.com/) and [Convex](https://convex.dev/) to obtain API keys.

1. Install dependencies:
    ```sh
    npm install
    ```

2. Create a .env.local file at the root directory and add the following:
    ```sh
    CONVEX_DEPLOYMENT=
    VITE_CONVEX_URL=
    VITE_CLERK_PUBLISHABLE_KEY=
    CLERK_ISSUER_URL=
    ```


3. Start the Convex Backend
    ```sh
    npx convex dev
    ```

4. Start the frontend
    ```sh
    npm run dev
    ```