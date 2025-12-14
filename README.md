# Job Application Tracker

This project is a full-stack application designed to help users track their job applications. It effectively manages the job seeking process by providing a clear overview of application statuses, details, and history.

The system is implemented using:
- **Django**: For the robust backend server and database management.
- **React**: For the dynamic and responsive client-side interface.
- **Go + Gemini AI**: For intelligent analysis of job application data.

## Project Structure

The codebase is organized into three main directories:

-   **`client/`**: Contains the Frontend React application. This includes the UI components, styling, and logic for user interaction.
-   **`server/`**: Contains the Backend Django application. This handles data persistence, API endpoints, and business logic.
-   **`data-analyzer/`**: Contains the Go-based AI analysis tool. Uses Google Gemini to extract insights from job descriptions (tech stacks, red flags detection).

## Getting Started

To get started with the project, you will need to set up both the client and the server independently. Detailed instructions for installation, configuration, and running each part of the application can be found in their respective README files.

### 📚 Documentation

-   **[Client Documentation](./client/README.md)**: Instructions for setting up the React frontend (Node.js, dependencies, scripts).
-   **[Server Documentation](./server/README.md)**: Instructions for setting up the Django backend (Python, virtual environment, migrations).
-   **[Data Analyzer Documentation](./data-analyzer/README.md)**: Instructions for running AI-powered job analysis (Go, Gemini API setup).
