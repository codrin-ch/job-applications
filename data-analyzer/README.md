# Job Applications Tracker - Data Analyzer

This is a Go-based AI analysis tool that uses Google Gemini to extract structured insights from unstructured job application data. It connects to the Django server's SQLite database and processes job descriptions to identify technologies, red flags, and other valuable information.

## Prerequisites

- Go 1.24+
- A Google Gemini API key

## Installation

1.  **Navigate to the data-analyzer directory:**

    ```bash
    cd data-analyzer
    ```

2.  **Install dependencies:**

    ```bash
    go mod download
    ```

## Configuration

Create a `.env` file in the `data-analyzer` directory with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
DB_PATH=../server/db.sqlite3
```

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) | - |
| `GEMINI_MODEL` | The Gemini model to use | - |
| `DB_PATH` | Path to the SQLite database | `../server/db.sqlite3` |

## Running the Analyzer

1.  **Run the application:**

    ```bash
    go run .
    ```

2.  **Build and run (optional):**

    ```bash
    go build -o data-analyzer
    ./data-analyzer
    ```

*Note: Ensure the Django server's database (`db.sqlite3`) exists and contains job applications.*

## Project Structure

- `agent/`: Gemini AI client wrapper and utilities.
    - `workflows/`: AI-powered analysis workflows.
- `config/`: Application configuration (environment variables).
- `db/`: Database connection and queries.
- `models/`: Data models (JobApplication).
- `main.go`: Entry point and workflow orchestration.

## Available Workflows

The analyzer includes the following AI-powered workflows:

### Tech Stack Extraction

Analyzes job descriptions to extract mentioned technologies, programming languages, frameworks, tools, and platforms.

**Example output:**
```
Tech Stack: Go, Python, PostgreSQL, Docker, Kubernetes, AWS, React
```

### Red Flags Detection

Identifies potential issues in job postings that might indicate problems with a position or company. Detects flags in the following categories:

| Category | Description |
|----------|-------------|
| `UNREALISTIC_EXPECTATIONS` | Excessive experience requirements, too many required technologies |
| `POOR_WORK_LIFE_BALANCE` | "Fast-paced environment", "wear many hats", implied long hours |
| `COMPENSATION_ISSUES` | Vague salary info, "competitive salary" without details |
| `HIGH_TURNOVER` | Frequent hiring for same role, "immediate start" urgency |
| `TOXIC_CULTURE` | "Family" culture emphasis, "thick skin required" |
| `UNREASONABLE_REQUIREMENTS` | Senior skills at junior pay, unpaid trial work |

**Example output:**
```
🚩 Red Flags:
   - [UNREALISTIC_EXPECTATIONS] Requires 10+ years experience for mid-level role
   - [POOR_WORK_LIFE_BALANCE] "Comfortable in a fast-moving environment" suggests high pressure
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Main Application                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Config    │    │  Database   │    │   Agent     │  │
│  │  (.env)     │───▶│  (SQLite)   │    │  (Gemini)   │  │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘  │
│                            │                   │         │
│                            ▼                   ▼         │
│                    ┌───────────────────────────────┐     │
│                    │         Workflows             │     │
│                    │  • Tech Stack Extraction      │     │
│                    │  • Red Flags Detection        │     │
│                    └───────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```
