# Job Applications Tracker

This is a Django-based application for tracking job applications.

## Prerequisites

- Python 3.10+
- pip

## Installation

1.  **Clone the repository:**
    (If you haven't already)

2.  **Create and activate a virtual environment:**

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

## Database Setup

1.  **Apply migrations:**
    
    This sets up the SQLite database with the necessary tables.

    ```bash
    python manage.py migrate
    ```

2.  **Create a superuser (Optional):**
    
    To access the Django admin interface:

    ```bash
    python manage.py createsuperuser
    ```

## Running the Application

1.  **Start the development server:**

    ```bash
    python manage.py runserver
    ```

2.  **Access the application:**
    
    Open your web browser and navigate to [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

    The admin interface is available at [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/).

## Project Structure

- `jobs/`: Main application containing models, views, and templates.
- `config/`: Project configuration settings.
- `db.sqlite3`: SQLite database file (created after migration).
- `manage.py`: Django's command-line utility for administrative tasks.

## UI Features & Capabilities

The application provides a modern, responsive user interface with the following capabilities:

### Dashboard & Analytics
- **Daily Goal Tracker:** Visual indicator showing today's progress against a daily application goal (default: 5).
- **Application Summary:** Interactive charts visualizing application status distribution and daily application growth over time.
- **Summary Modal:** Quick access to analytics without leaving the main view.

### Job Application Management
- **Add New Applications:** targeted modal form to quickly log new applications with essential details (Company, URL, Job Description, Salary, etc.).
- **Interactive List View:**
    - **Sorting:** Sort applications by Title, Company, Status, or Date.
    - **Filtering:** Filter the list by specific statuses (e.g., hide 'Rejected' or 'Avoid').
    - **Inline Status Updates:** Change application status (e.g., Applied -> Interview) directly from the list view.
- **Detailed View:** Click any application to see full details in a modal.
    - **Activity Steps:** Track specific interaction steps for each job (e.g., "Screening Call", "Take-home Assignment").
    - **Editable Fields:** Inline editing capabilities for fields like Salary.
    - **Rich Text:** "Read more" functionality for long job descriptions.

### Job Boards Tracker
- **Board Management:** Keep track of various job boards used for sourcing.
- **Daily Visit Tracking:** One-click mechanism to mark boards as "visited" for the day to ensure consistent sourcing habits.

### Workflow Customization
- **Statuses:** Pre-defined status workflow including: *Applied, Technical Interview, HR Interview, Offer, Rejected, Ghosted, Avoid*.
- **Visual Cues:** Distinct color coding for different statuses and sources to improve readability.

## Linting

This project uses `black` for code formatting and `ruff` for linting.

1.  **Run Black (Formatter):**

    Check for formatting issues:
    ```bash
    black --check .
    ```

    Automatically format code:
    ```bash
    black .
    ```

2.  **Run Ruff (Linter):**

    Check for linting errors:
    ```bash
    ruff check .
    ```

    Automatically fix fixable errors:
    ```bash
    ruff check --fix .
    ```

    Configuration for both tools is found in `pyproject.toml`.
