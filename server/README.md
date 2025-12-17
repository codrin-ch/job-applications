# Job Applications Tracker - API Server

This is the Django-based API backend for the Job Applications Tracker. It provides JSON endpoints for the React client to manage job applications and job boards.

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

## Running the Server

1.  **Start the development server:**

    ```bash
    python manage.py runserver
    ```

2.  **Access the API:**
    
    The server runs on [http://127.0.0.1:8000/](http://127.0.0.1:8000/).
    
    - Admin Interface: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
    - API Endpoints (see below)

## Project Structure

- `jobs/`: Main application containing models and views (API controllers).
- `config/`: Project configuration settings.
- `db.sqlite3`: SQLite database file.
- `manage.py`: Django's command-line utility.

## API Endpoints

The server exposes the following JSON endpoints:

### Job Applications

- **`GET /api/jobs/`**
  - Returns a summary of job applications, including:
    - List of all jobs (sorted by status and date).
    - Daily application stats (for graphs).
    - Status summary counts.
    - Today's application count vs daily goal.

- **`POST /add_job/`**
  - Creates a new job application.
  - Body: `{ job_title, company_name, company_url, job_description, resume_version, salary, status, source }`

- **`PUT /update_job_field/<int:job_id>/`**
  - Updates a specific field of a job application.
  - Body: `{ field_name: value }` (e.g., `{ "status": "Rejected" }`)

- **`POST /add_step/<int:job_id>/`**
  - Adds a new activity step to a job application.
  - Body: `{ title, description }`

### Job Boards

- **`GET /api/job-boards/`**
  - Returns a list of job boards with their last visited status.

- **`POST /add_job_board/`**
  - Adds a new job board.
  - Body: `{ name, url }`

- **`PUT /update_last_visited/<int:board_id>/`**
  - Updates the `last_visited` timestamp for a job board to now.

### Work Experience

- **`GET /api/work-experiences/`**
  - Returns all work experiences with their achievements as a nested array.

- **`POST /add_work_experience/`**
  - Creates a new work experience.
  - Body: `{ job_title, company_name, company_url, start_date, end_date }`

- **`POST /add_work_achievement/<int:experience_id>/`**
  - Adds a new achievement to a work experience.
  - Body: `{ description }`

- **`PUT /update_work_achievement/<int:achievement_id>/`**
  - Updates an existing work achievement.
  - Body: `{ description }`

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
