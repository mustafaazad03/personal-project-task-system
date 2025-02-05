# Task Management System Revamped Documentation

## Overview
The Task Management System Revamped is a full-stack web application built with Next.js, employing PostgreSQL as its database solution. It leverages the drizzle-ORM for database operations, incorporates JWT-based authentication, and provides a modern, responsive UI using Tailwind CSS. The application offers functionality for managing user accounts, projects, and associated tasks.

## Architecture
- **Frontend:** Built with Next.js using React for UI components and pages. It includes a login/register page, a dashboard for displaying projects and tasks, and modals for task creation and editing.
- **Backend & API:** Consists of multiple API routes (under `src/app/api`) for user authentication (`/api/auth`), project management (`/api/projects`), and task operations (`/api/tasks`). Each endpoint performs CRUD operations and handles error situations gracefully.
- **Database:** Utilizes PostgreSQL, with schema managed using drizzle-ORM. Migrations are applied via drizzle-kit. The schema comprises three tables: `users`, `projects`, and `tasks`, with proper relationships and constraints.
- **Authentication:** Implements user authentication using JWTs and bcrypt for password hashing. Users register and log in via the `/api/auth` endpoint.
- **State Management:** Uses Zustand for client-side state management, especially for tasks and projects, enabling a reactive UI without excessive prop drilling.

## Database Schema
- **Users Table:** Contains user details such as `id`, `name`, `email`, `password`, and `createdAt`. Emails are unique, and ID values are generated as UUIDs.
- **Projects Table:** Captures project information including `id`, `name`, `description`, `userId` (as foreign key referencing users), and `createdAt`. It supports establishing a many-to-one relationship with users.
- **Tasks Table:** Maintains task details like `id`, `title`, `description`, `priority`, `status`, `dueDate`, `projectId`, `userId`, `createdAt`, and `updatedAt`. Foreign keys link tasks to projects and users.

## API Endpoints

### Authentication API (/api/auth)
- **POST:** Handles user registration and login.
  - **Register:** Hashes the provided password using bcrypt, validates the existence of the user, creates a new user record, and returns a JWT token.
  - **Login:** Validates credentials and generates a JWT token upon successful authentication.

### Projects API (/api/projects)
- **GET:** Fetches all projects linked to a specific user by user ID.
- **POST:** Creates a new project with a given name, description, and associated user ID.
- **PATCH:** Updates an existing project's properties (e.g., name and description) based on project ID.
- **DELETE:** Removes a project specified by its ID.

### Tasks API (/api/tasks)
- **GET:** Retrieves tasks filtered by user and optionally by project.
- **POST:** Allows creation of a new task with details like title, description, priority, status, due date, and relational fields.
- **PATCH:** Updates a task using its ID and a payload containing the new properties, including updating its timestamp.
- **DELETE:** Deletes a task based on its ID.

## UI Components & Pages

### Login / Registration Page (src/app/page.tsx)
- Presents a form for users to either log in or register.
- Sets the authentication token in a browser cookie upon successful authentication and redirects to the dashboard.

### Dashboard Page (src/app/dashboard/page.tsx)
- **Sidebar:** Displays a list of projects with options to create, edit, and delete projects.
- **Main Content:** Lists tasks associated with the selected project, including task controls for editing, completing, reopening, and deleting tasks.
- Implements a Task Modal (via `src/components/task-modal.tsx`) for both task creation and editing, facilitating form validation and data submission.

### Task Modal (src/components/task-modal.tsx)
- Provides an interactive form to create or edit tasks.
- Uses date-fns for date formatting and includes form validation with error messages.
- Supports dynamic updates to task details like title, description, priority, status, and due date.

## Utility and Helpers

### Task Transformation (src/app/api/tasks/transform.ts)
- Contains functions for transforming task data from the database schema format to an API-friendly format (camelCase conversion).

### Database Connection (src/db/index.ts)
- Establishes the database connection using `postgres` and configures drizzle-ORM with the PostgreSQL schema.

### Global Styles and Configurations
- **Globals & Tailwind:** The global stylesheet (src/app/globals.css) imports Tailwind CSS. PostCSS is configured via `postcss.config.mjs`.
- **Theme:** Next-themes is used in the layout for supporting dark and light modes, seamlessly integrated within the `src/app/layout.tsx`.

## State Management
- **Zustand Store (src/store/useStore.ts):** Provides a lightweight approach to client-side state management for tasks and projects. The store supports operations to set, add, update, and delete tasks and projects.

## Configuration Files
- **drizzle.config.ts:** Configuration for drizzle-kit including the output directory, schema file, and database credentials (using environment variables).
- **tsconfig.json & eslint.config.mjs:** TypeScript configuration and ESLint settings ensure code quality and consistency.
- **next.config.ts:** Next.js configuration including image remote patterns for integrating Unsplash images.
- **package.json:** Lists project dependencies, both for production and development, and includes scripts for running and building the project.

## Installation & Setup
1. **Clone the Repository:** 
   Clone the repository and navigate to the project directory.
2. **Install Dependencies:** 
   Run `npm install` or `yarn install` to install all required packages.
3. **Configure Environment:** 
   Create a `.env` file with the required environment variables, notably `DATABASE_URL` and `JWT_SECRET`.
4. **Database Setup:** 
   Use drizzle-kit to run migrations and set up the PostgreSQL database.
5. **Run the Project:** 
   Use `npm run dev` or `yarn dev` to start the development server and access the application locally.

## Conclusion
This project demonstrates a modern, scalable architecture integrating Next.js, PostgreSQL, and drizzle-ORM with efficient state management and secure authentication practices. The codebase is modular and well-documented, making it maintainable and extendable for future enhancements.
