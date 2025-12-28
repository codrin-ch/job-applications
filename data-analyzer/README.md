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
SHOULD_RUN_AGENT=true
DB_PATH=../server/db.sqlite3
```

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) | - |
| `GEMINI_MODEL` | The Gemini model to use | - |
| `SHOULD_RUN_AGENT` | Set to `true` to enable AI agent execution | `false` |
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


## Project Structure

- `agent/`: Gemini AI client wrapper and utilities.
    - `workflows/`: AI-powered analysis workflows definition.
- `api/`: HTTP API server and request handlers.
- `config/`: Application configuration (environment variables).
- `db/`: Database connection and queries.
- `models/`: Data models (JobApplication, Workflow, CoverLetterInput).
- `scenarios/`: High-level execution scripts combining workflows and database operations.
- `main.go`: Entry point, workflow orchestration, and HTTP server startup.

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

### Extract Role Details

Analyzes job descriptions to extract formal responsibilities and requirements, structuring them for further use (e.g., resume tailoring).

**Example output:**
```
Responsibilities: Design and implement scalable backend services...
Requirements: 5+ years of experience with Go, strong knowledge of distributed systems...
```

### Generate Cover Letter

Creates personalized cover letters using AI by combining job details, company research, extracted insights, and user's work experience. Accepts curated inputs from the client side.

**Input:**
- Job application details (title, company)
- Selected deep dive research items
- Selected workflow insights (responsibilities, requirements)
- Selected company research (software engineering, business, company overview)
- Selected work experience achievements

### Company Research

Performs automated research on companies using Gemini AI with grounding capabilities. Gathers insights about the company's engineering culture, business model, and general overview from recent sources (2024-2025).

**Example output:**
```json
{
  "software_engineering": [{"value": "Microservices architecture", "example": "...", "source": "..."}],
  "business": [{"value": "B2B SaaS", "example": "...", "source": "..."}],
  "company_overview": [{"value": "Founded in 2020", "example": "...", "source": "..."}]
}
```

## HTTP API Server

The data-analyzer includes an HTTP API server that exposes AI workflows to the client application.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/job_application/generate_cover_letter` | Generates a cover letter for specified job applications using curated inputs |
| `POST` | `/job_application/generate_insight` | Extracts role details and insights from job descriptions |
| `POST` | `/job_application/research_company` | Performs company research using Gemini AI with grounding |

### Configuration

Add the following to your `.env` file to enable the HTTP server:

```env
SERVER_PORT=:8080
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
│                    │           Scenarios           │     │
│                    │      (Orchestration)          │     │
│                    └───────────────┬───────────────┘     │
│                                    │                     │
│                                    ▼                     │
│                    ┌───────────────────────────────┐     │
│                    │         Workflows             │     │
│                    │  • Red Flags Detection        │     │
│                    │  • Extract Role Details       │     │
│                    └───────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```
