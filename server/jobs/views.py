import json

from django.db.models import Case, Count, IntegerField, When
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from .models import (
    SOURCE_CHOICES,
    STATUS_CHOICES,
    JobApplication,
    JobBoard,
    ResearchData,
    Step,
    WorkAchievement,
    WorkExperience,
)

DAILY_GOAL = 5
STATUS_ORDER = Case(
    When(status="Offer", then=1),
    When(status="Technical Interview", then=2),
    When(status="HR Interview", then=3),
    When(status="Preparing Application", then=4),
    When(status="Applied", then=5),
    When(status="Ghosted", then=6),
    When(status="Rejected", then=7),
    When(status="Avoid", then=8),
    output_field=IntegerField(),
)
CATEGORY_MAP = {
    "Preparing Application": "Preparing Application",
    "Applied": "Applied",
    "HR Interview": "In Progress",
    "Technical Interview": "In Progress",
    "Rejected": "Negative",
    "Ghosted": "Negative",
    "Avoid": "Negative",
    "Offer": "Offer",
}


@require_http_methods(["PUT"])
def update_job_field(request, job_id):
    try:
        data = json.loads(request.body)
        # get the field name from data object { status: 'new_state' }
        field_name = list(data.keys())[0]
        new_value = data.get(field_name)
        job = get_object_or_404(JobApplication, pk=job_id)

        # For salary, cover_letter, and resume_version fields, no validation needed (free text)
        if field_name in ["salary", "cover_letter", "resume_version"]:
            setattr(job, field_name, new_value)
            job.save()
            return JsonResponse({"success": True})

        # For status and source, validate against choices
        valid_choices = STATUS_CHOICES if field_name == "status" else SOURCE_CHOICES

        # Check if the new value is valid
        if new_value in [choice[0] for choice in valid_choices]:
            # Check for status transition from "Preparing Application" to "Applied"
            if (
                field_name == "status"
                and job.status == "Preparing Application"
                and new_value == "Applied"
            ):
                Step.objects.create(
                    job_application=job,
                    title="Applied",
                    description="Application sent",
                )
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
        resume_version = data.get("resume_version", "")
        salary = data.get("salary", "")
        status = data.get("status", "Preparing Application")
        source = data.get("source", "Careers Website")

        if not all(
            [job_title, company_name, company_url, job_description]
        ):
            return JsonResponse(
                {"success": False, "error": "job_title, company_name, company_url, and job_description are required"},
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

        data.append(
            {
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
                "visited_today": visited_today,
            }
        )

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
        "Preparing Application": 0,
        "Applied": 0,
        "In Progress": 0,
        "Negative": 0,
        "Offer": 0,
    }

    for status, count in status_count_map.items():
        if status in CATEGORY_MAP:
            category = CATEGORY_MAP[status]
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
        .prefetch_related("workflows")
        .prefetch_related("research_data")
    )

    jobs_data = []
    for job in jobs_queryset:
        steps = [
            {
                "title": step.title,
                "description": step.description,
                "created_at": step.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for step in job.steps.all()
        ]
        job_workflows = []
        workflows = job.workflows.all().filter()
        for workflow in workflows:
            if workflow.workflow_name == "extract_role_details":
                role_details = workflow.parseOutput()
                for role_detail in role_details:
                    if role_detail["job_id"] == job.id:
                        job_workflows.append(
                            {
                                "workflow_name": workflow.workflow_name,
                                "responsibilities": role_detail["responsibilities"],
                                "requirements": role_detail["requirements"],
                            }
                        )
            elif workflow.workflow_name == "generate_cover_letter":
                job_workflows.append(
                    {
                        "workflow_name": workflow.workflow_name,
                        "cover_letter": workflow.output,
                    }
                )
            elif workflow.workflow_name == "research_company":
                company_research = workflow.parseOutput()
                for key in company_research.keys():
                    company_research[key] = [
                        {
                            "value": item["value"],
                            "example": item["example"],
                        }
                        for item in company_research[key]
                    ]
                job_workflows.append(
                    {
                        "workflow_name": workflow.workflow_name,
                        "company_research": company_research,
                    }
                )

        jobs_data.append(
            {
                "id": job.id,
                "job_title": job.job_title,
                "company_name": job.company_name,
                "company_url": job.company_url,
                "job_description": job.job_description,
                "resume_version": job.resume_version,
                "salary": job.salary,
                "status": job.status,
                "source": job.source,
                "created_at": job.created_at.strftime("%b. %d, %Y, %I:%M %p")
                .replace("AM", "a.m.")
                .replace("PM", "p.m."),
                "updated_at": job.updated_at.strftime("%b. %d, %Y, %I:%M %p")
                .replace("AM", "a.m.")
                .replace("PM", "p.m."),
                "steps": steps,
                "workflows": job_workflows,
                "cover_letter": job.cover_letter,
                "research_data": [
                    {
                        "id": rd.id,
                        "category": rd.category,
                        "info": rd.info,
                    }
                    for rd in job.research_data.all()
                ],
            }
        )

    return JsonResponse(
        {
            "jobs": jobs_data,
            "today_jobs_count": today_jobs_count,
            "daily_goal": DAILY_GOAL,
            "goal_reached": goal_reached,
            "status_summary": status_summary,
            "daily_stats": daily_stats,
            "status_choices": [
                s[0] for s in STATUS_CHOICES
            ],  # Just sending codes for now, or full tuples if needed
        }
    )


# Work Experience Views


def get_work_experiences(request):
    work_experiences = WorkExperience.objects.order_by("-start_date").prefetch_related(
        "work_achievements"
    )

    data = []
    for experience in work_experiences:
        achievements = [
            {
                "id": achievement.id,
                "description": achievement.description,
            }
            for achievement in experience.work_achievements.all()
        ]

        data.append(
            {
                "id": experience.id,
                "job_title": experience.job_title,
                "company_name": experience.company_name,
                "company_url": experience.company_url,
                "start_date": experience.start_date,
                "end_date": experience.end_date,
                "work_achievements": achievements,
            }
        )

    return JsonResponse({"work_experiences": data})


@require_POST
def add_work_experience(request):
    try:
        data = json.loads(request.body)
        job_title = data.get("job_title")
        company_name = data.get("company_name")
        company_url = data.get("company_url")
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if not all([job_title, company_name, company_url, start_date, end_date]):
            return JsonResponse(
                {"success": False, "error": "All fields are required"},
                status=400,
            )

        work_experience = WorkExperience.objects.create(
            job_title=job_title,
            company_name=company_name,
            company_url=company_url,
            start_date=start_date,
            end_date=end_date,
        )

        return JsonResponse(
            {
                "success": True,
                "work_experience": {
                    "id": work_experience.id,
                    "job_title": work_experience.job_title,
                    "company_name": work_experience.company_name,
                    "company_url": work_experience.company_url,
                    "start_date": work_experience.start_date,
                    "end_date": work_experience.end_date,
                    "work_achievements": [],
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@require_POST
def add_work_achievement(request, experience_id):
    try:
        data = json.loads(request.body)
        description = data.get("description")

        if not description:
            return JsonResponse(
                {"success": False, "error": "Description is required"},
                status=400,
            )

        work_experience = get_object_or_404(WorkExperience, pk=experience_id)
        achievement = WorkAchievement.objects.create(
            work_experience=work_experience, description=description
        )

        return JsonResponse(
            {
                "success": True,
                "work_achievement": {
                    "id": achievement.id,
                    "description": achievement.description,
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@require_http_methods(["PUT"])
def update_work_achievement(request, achievement_id):
    try:
        data = json.loads(request.body)
        description = data.get("description")

        if not description:
            return JsonResponse(
                {"success": False, "error": "Description is required"},
                status=400,
            )

        achievement = get_object_or_404(WorkAchievement, pk=achievement_id)
        achievement.description = description
        achievement.save()

        return JsonResponse(
            {
                "success": True,
                "work_achievement": {
                    "id": achievement.id,
                    "description": achievement.description,
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


# Research Data Views


@csrf_exempt
@require_POST
def add_research_data(request, job_id):
    try:
        data = json.loads(request.body)
        category = data.get("category")
        info = data.get("info")

        if category is None or not info:
            return JsonResponse(
                {"success": False, "error": "Category and info are required"},
                status=400,
            )

        job = get_object_or_404(JobApplication, pk=job_id)
        research_data = ResearchData.objects.create(
            job_application=job, category=category, info=info
        )

        return JsonResponse(
            {
                "success": True,
                "research_data": {
                    "id": research_data.id,
                    "category": research_data.category,
                    "info": research_data.info,
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT"])
def update_research_data(request, research_data_id):
    try:
        data = json.loads(request.body)
        category = data.get("category")
        info = data.get("info")

        if category is None and not info:
            return JsonResponse(
                {"success": False, "error": "Category or info is required"},
                status=400,
            )

        research_data = get_object_or_404(ResearchData, pk=research_data_id)

        if category is not None:
            research_data.category = category
        if info:
            research_data.info = info

        research_data.save()

        return JsonResponse(
            {
                "success": True,
                "research_data": {
                    "id": research_data.id,
                    "category": research_data.category,
                    "info": research_data.info,
                },
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
