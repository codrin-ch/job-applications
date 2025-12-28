# Job Application Tracker

This project is a full-stack application designed to help users track their job applications. It effectively manages the job seeking process by providing a clear overview of application statuses, details, and history.

The system is implemented using:
- **Django**: For the robust backend server and database management.
- **React**: For the dynamic and responsive client-side interface.
- **Go + Gemini AI**: For intelligent analysis of job application data, cover letter generation, and company research.

## Key Features

- **📝 Cover Letter Generation**: AI-powered cover letter creation using job details, company research, user's work experience, and extracted insights.
- **🔍 Company Research**: Automated research workflow that gathers insights about companies (engineering culture, business model, company overview) using Gemini AI with grounding.
- **📊 Job Application Tracking**: Comprehensive status management, activity steps, and analytics dashboard.
- **🎯 Deep Dive Research**: Categorized research data for responsibilities, requirements, and company/role insights.
- **🚀 Workflow Insights**: AI-extracted role details, red flags detection, and tech stack identification.

## Project Structure

The codebase is organized into three main directories:

-   **`client/`**: Contains the Frontend React application. This includes the UI components, styling, and logic for user interaction.
-   **`server/`**: Contains the Backend Django application. This handles data persistence, API endpoints, and business logic.
-   **`data-analyzer/`**: Contains the Go-based AI analysis tool and HTTP API server. Uses Google Gemini to generate cover letters, research companies, and extract structured insights from job descriptions.

## Getting Started

To get started with the project, you will need to set up both the client and the server independently. Detailed instructions for installation, configuration, and running each part of the application can be found in their respective README files.

### 📚 Documentation

-   **[Client Documentation](./client/README.md)**: Instructions for setting up the React frontend (Node.js, dependencies, scripts).
-   **[Server Documentation](./server/README.md)**: Instructions for setting up the Django backend (Python, virtual environment, migrations).
-   **[Data Analyzer Documentation](./data-analyzer/README.md)**: Instructions for running AI-powered job analysis (Go, Gemini API setup).
