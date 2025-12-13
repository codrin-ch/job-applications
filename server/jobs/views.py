import json

from django.db.models import Case, Count, IntegerField, When
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods, require_POST

from .models import SOURCE_CHOICES, STATUS_CHOICES, JobApplication, JobBoard, Step

DAILY_GOAL = 5
STATUS_ORDER = Case(
    When(status="Offer", then=1),
    When(status="Technical Interview", then=2),
    When(status="HR Interview", then=3),
    When(status="Applied", then=4),
    When(status="Ghosted", then=5),
    When(status="Rejected", then=6),
    When(status="Avoid", then=7),
    output_field=IntegerField(),
)


def jobs(request):
    queryset = JobApplication.objects.order_by("-created_at").values(
        "job_title",
        "company_name",
        "company_url",
        "job_description",
        "resume_version",
        "salary",
        "status",
        "created_at",
    )
    data = list(queryset)
    return JsonResponse(data, safe=False)


def jobs_list(request):
    jobs = (
        JobApplication.objects.annotate(status_priority=STATUS_ORDER)
        .order_by("status_priority", "-created_at")
        .prefetch_related("steps")
    )

    # Calculate today's job applications count
    today = timezone.now().date()
    today_start = timezone.make_aware(
        timezone.datetime.combine(today, timezone.datetime.min.time())
    )
    today_jobs_count = JobApplication.objects.filter(created_at__gte=today_start).count()

    status_counts = JobApplication.objects.values("status").annotate(count=Count("id"))
    status_count_map = {item["status"]: item["count"] for item in status_counts}

    # Group statuses into categories for the chart
    categories = {
        "Applied": 0,
        "In Progress": 0,
        "Negative": 0,
        "Offer": 0,
    }

    category_map = {
        "Applied": "Applied",
        "HR Interview": "In Progress",
        "Technical Interview": "In Progress",
        "Rejected": "Negative",
        "Ghosted": "Negative",
        "Avoid": "Negative",
        "Offer": "Offer",
    }

    for status, count in status_count_map.items():
        if status in category_map:
            category = category_map[status]
            categories[category] += count

    status_summary = [
        {"label": name, "count": count} for name, count in categories.items()
    ]

    # Calculate daily applications for the growth chart
    daily_applications = (
        JobApplication.objects.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    daily_stats = [
        {"date": item["date"].strftime("%Y-%m-%d"), "count": item["count"]}
        for item in daily_applications
    ]

    return render(
        request,
        "jobs/jobs.html",
        {
            "jobs": jobs,
            "status_choices": STATUS_CHOICES,
            "source_choices": SOURCE_CHOICES,
            "today_jobs_count": today_jobs_count,
            "daily_goal": DAILY_GOAL,
            "goal_reached": today_jobs_count >= DAILY_GOAL,
            "status_summary_json": json.dumps(status_summary),
            "daily_stats_json": json.dumps(daily_stats),
        },
    )


@require_http_methods(["PUT"])
def update_job_field(request, job_id):
    try:
        data = json.loads(request.body)
        # get the field name from data object { status: 'new_state' }
        field_name = list(data.keys())[0]
        new_value = data.get(field_name)
        job = get_object_or_404(JobApplication, pk=job_id)

        # For salary field, no validation needed (free text)
        if field_name == "salary":
            setattr(job, field_name, new_value)
            job.save()
            return JsonResponse({"success": True})

        # For status and source, validate against choices
        valid_choices = STATUS_CHOICES if field_name == "status" else SOURCE_CHOICES

        # Check if the new value is valid
        if new_value in [choice[0] for choice in valid_choices]:
            setattr(job, field_name, new_value)
            job.save()
            return JsonResponse({"success": True})
        else:
            return JsonResponse(
                {"success": False, "error": f"Invalid {field_name}"}, status=400
            )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@require_POST
def add_step(request, job_id):
    try:
        data = json.loads(request.body)
        title = data.get("title")
        description = data.get("description")

        if not title or not description:
            return JsonResponse(
                {"success": False, "error": "Title and description are required"},
                status=400,
            )

        job = get_object_or_404(JobApplication, pk=job_id)
        step = Step.objects.create(
            job_application=job, title=title, description=description
        )

        return JsonResponse(
            {
                "success": True,
                "step": {
                    "title": step.title,
                    "description": step.description,
                    "created_at": step.created_at.strftime(
                        "%Y-%m-%d %H:%M"
                    ),  # Format as needed, or just str()
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@require_POST
def add_job(request):
    try:
        data = json.loads(request.body)
        job_title = data.get("job_title")
        company_name = data.get("company_name")
        company_url = data.get("company_url")
        job_description = data.get("job_description")
        resume_version = data.get("resume_version")
        salary = data.get("salary", "")
        status = data.get("status", "Applied")
        source = data.get("source", "Careers Website")

        if not all(
            [job_title, company_name, company_url, job_description, resume_version]
        ):
            return JsonResponse(
                {"success": False, "error": "All fields except salary are required"},
                status=400,
            )

        job = JobApplication.objects.create(
            job_title=job_title,
            company_name=company_name,
            company_url=company_url,
            job_description=job_description,
            resume_version=resume_version,
            salary=salary,
            status=status,
            source=source,
        )

        return JsonResponse(
            {
                "success": True,
                "job": {
                    "id": job.id,
                    "job_title": job.job_title,
                    "company_name": job.company_name,
                    "company_url": job.company_url,
                    "job_description": job.job_description,
                    "resume_version": job.resume_version,
                    "status": job.status,
                    "source": job.source,
                    "created_at": job.created_at.strftime("%b. %d, %Y, %I:%M %p")
                    .replace("AM", "a.m.")
                    .replace("PM", "p.m."),  # Match Django default template format roughly
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


# Job Boards Views
def job_boards_list(request):
    job_boards = JobBoard.objects.order_by("last_visited")

    # Add visited_today flag to each board
    today = timezone.now().date()
    visited_today_count = 0
    total_boards = job_boards.count()

    for board in job_boards:
        if board.last_visited:
            board.visited_today = board.last_visited.date() == today
            if board.visited_today:
                visited_today_count += 1
        else:
            board.visited_today = False

    # Goal is reached when all boards have been visited today
    all_visited_today = total_boards > 0 and visited_today_count == total_boards

    return render(
        request,
        "jobs/job_boards.html",
        {
            "job_boards": job_boards,
            "total_boards": total_boards,
            "visited_today_count": visited_today_count,
            "all_visited_today": all_visited_today,
        },
    )


@require_POST
def add_job_board(request):
    try:
        data = json.loads(request.body)
        name = data.get("name")
        url = data.get("url")

        if not all([name, url]):
            return JsonResponse(
                {"success": False, "error": "Name and URL are required"}, status=400
            )

        job_board = JobBoard.objects.create(name=name, url=url)

        return JsonResponse(
            {
                "success": True,
                "job_board": {
                    "id": job_board.id,
                    "name": job_board.name,
                    "url": job_board.url,
                    "last_visited": (
                        job_board.last_visited.strftime("%b. %d, %Y, %I:%M %p")
                        .replace("AM", "a.m.")
                        .replace("PM", "p.m.")
                        if job_board.last_visited
                        else "-"
                    ),
                    "created_at": job_board.created_at.strftime("%b. %d, %Y, %I:%M %p")
                    .replace("AM", "a.m.")
                    .replace("PM", "p.m."),
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@require_http_methods(["PUT"])
def update_last_visited(request, board_id):
    try:
        job_board = get_object_or_404(JobBoard, pk=board_id)
        job_board.last_visited = timezone.now()
        job_board.save(update_fields=["last_visited"])

        return JsonResponse(
            {
                "success": True,
                "last_visited": job_board.last_visited.strftime("%b. %d, %Y, %I:%M %p")
                .replace("AM", "a.m.")
                .replace("PM", "p.m."),
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


def get_job_boards(request):
    job_boards = JobBoard.objects.order_by("last_visited")

    # Add visited_today flag to each board
    today = timezone.now().date()
    data = []
    
    for board in job_boards:
        visited_today = False
        if board.last_visited:
            visited_today = board.last_visited.date() == today
        
        data.append({
            "id": board.id,
            "name": board.name,
            "url": board.url,
            "last_visited": (
                board.last_visited.strftime("%b. %d, %Y, %I:%M %p")
                .replace("AM", "a.m.")
                .replace("PM", "p.m.")
                if board.last_visited
                else None
            ),
            "visited_today": visited_today
        })

    return JsonResponse({"job_boards": data})


def get_jobs(request):
    # Calculate today's job applications count
    today = timezone.now().date()
    today_start = timezone.make_aware(
        timezone.datetime.combine(today, timezone.datetime.min.time())
    )
    today_jobs_count = JobApplication.objects.filter(created_at__gte=today_start).count()
    goal_reached = today_jobs_count >= DAILY_GOAL

    # Statistics for charts
    status_counts = JobApplication.objects.values("status").annotate(count=Count("id"))
    status_count_map = {item["status"]: item["count"] for item in status_counts}

    categories = {
        "Applied": 0,
        "In Progress": 0,
        "Negative": 0,
        "Offer": 0,
    }

    category_map = {
        "Applied": "Applied",
        "HR Interview": "In Progress",
        "Technical Interview": "In Progress",
        "Rejected": "Negative",
        "Ghosted": "Negative",
        "Avoid": "Negative",
        "Offer": "Offer",
    }

    for status, count in status_count_map.items():
        if status in category_map:
            category = category_map[status]
            categories[category] += count

    status_summary = [
        {"label": name, "count": count} for name, count in categories.items()
    ]

    daily_applications = (
        JobApplication.objects.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    daily_stats = [
        {"date": item["date"].strftime("%Y-%m-%d"), "count": item["count"]}
        for item in daily_applications
    ]

    # Jobs list
    jobs_queryset = (
        JobApplication.objects.annotate(status_priority=STATUS_ORDER)
        .order_by("status_priority", "-created_at")
        .prefetch_related("steps")
    )
    
    jobs_data = []
    for job in jobs_queryset:
        steps = [
            {
                "title": step.title,
                "description": step.description,
                "created_at": step.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for step in job.steps.all()
        ]
        jobs_data.append({
            "id": job.id,
            "job_title": job.job_title,
            "company_name": job.company_name,
            "company_url": job.company_url,
            "job_description": job.job_description,
            "resume_version": job.resume_version,
            "salary": job.salary,
            "status": job.status,
            "source": job.source,
            "created_at": job.created_at.strftime("%b. %d, %Y, %I:%M %p").replace("AM", "a.m.").replace("PM", "p.m."),
            "updated_at": job.updated_at.strftime("%b. %d, %Y, %I:%M %p").replace("AM", "a.m.").replace("PM", "p.m."),
            "steps": steps
        })

    return JsonResponse({
        "jobs": jobs_data,
        "today_jobs_count": today_jobs_count,
        "daily_goal": DAILY_GOAL,
        "goal_reached": goal_reached,
        "status_summary": status_summary,
        "daily_stats": daily_stats,
        "status_choices": [s[0] for s in STATUS_CHOICES], # Just sending codes for now, or full tuples if needed
    })
