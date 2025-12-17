# Job Applications Tracker - Client

This is the React-based frontend for the Job Applications Tracker application.

## Prerequisites

- Node.js 18+
- npm (Node Package Manager)

## Installation

1.  **Navigate to the client directory:**

    ```bash
    cd client
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Running the Application

1.  **Start the development server:**

    ```bash
    npm run dev
    ```

2.  **Access the application:**

    Open your web browser and navigate to [http://localhost:5173/](http://localhost:5173/).

    *Note: Ensure the Django server is running on port 8000 for API requests to work.*

## Project Structure

- `src/`: Main source directory.
    - `components/`: React components.
        - `job-application/`: Job application components (JobApplications, AddJobModal, JobDetailsModal, etc.).
        - `work-experience/`: Work experience components (WorkExperience, WorkExperienceSection, AddWorkExperienceModal).
        - `JobBoards.tsx`: Job boards tracker component.
    - `utils/`: Utility functions (CSRF handling).
    - `App.tsx`: Main application component and routing.
    - `main.tsx`: Entry point.
- `public/`: Static assets.
- `vite.config.ts`: Vite configuration.

## UI Features & Capabilities

The client provides a modern, responsive user interface mirroring the server-side functionalities:

### Dashboard & Analytics
- **Daily Goal Tracker:** Visual indicator showing today's progress against a daily application goal.
- **Application Summary:** Interactive charts (Chart.js) visualizing application status distribution and daily application growth.
- **Summary Modal:** Quick access to analytics charts.

### Job Application Management
- **Add New Applications:** Modal form to quickly log new applications with details like Company, Job Description, Salary, etc.
- **Interactive List View:**
    - **Sorting:** Sort applications by Title, Company, Status, or Date.
    - **Filtering:** Filter the list by specific statuses (e.g., hide 'Rejected').
    - **Inline Status Updates:** Change application status directly from the list view.
- **Detailed View:** Click any application to see full details in a modal.
    - **Activity Steps:** Track specific interaction steps (e.g., "Screening Call").
    - **Deep Dive:** Research data organized by category (Responsibilities, Requirements, Company Research, Role Research) with inline editing and auto-save.
    - **Editable Fields:** Inline editing for Salary.
    - **Rich Text:** "Read more" functionality for long descriptions.

### Job Boards Tracker
- **Board Management:** Add and track various job boards.
- **Daily Visit Tracking:** Track daily visits to ensure consistent sourcing habits. Links update "Last Visited" timestamp automatically.

### Work Experience Management
- **Experience Tracking:** Add and manage work experience entries with job title, company, dates.
- **Achievements:** Add achievements to each work experience with inline editing.
- **Auto-Save:** Achievement updates are automatically saved with debouncing.

### Workflow Customization
- **Status Filtering:** Detailed filter dropdown to view specific subsets of applications.
- **Visual Cues:** Distinct styling for different statuses.

## Linting

This project uses ESLint for code quality and linting.

1.  **Run Linter:**

    Check for code issues:
    ```bash
    npm run lint
    ```
