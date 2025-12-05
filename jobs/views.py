from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST, require_http_methods
import json
from .models import JobApplication, Step, STATUS_CHOICES, SOURCE_CHOICES
from django.utils import timezone
from django.db.models import Case, When, IntegerField


DAILY_GOAL = 5
STATUS_ORDER = Case(
    When(status='Offer', then=1),
    When(status='Technical Interview', then=2),
    When(status='HR Interview', then=3),
    When(status='Applied', then=4),
    When(status='Ghosted', then=5),
    When(status='Rejected', then=6),
    When(status='Avoid', then=7),
    output_field=IntegerField(),
)

def jobs(request):
    queryset = JobApplication.objects.order_by('-created_at').values("job_title", "company_name", "company_url", "job_description", "resume_version", "salary", "status", "created_at")
    data = list(queryset)
    return JsonResponse(data, safe=False)


def jobs_list(request):
    jobs = JobApplication.objects.annotate(
        status_priority=STATUS_ORDER
    ).order_by('status_priority', '-created_at').prefetch_related('steps')
    
    # Calculate today's job applications count
    today = timezone.now().date()
    today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    today_jobs_count = JobApplication.objects.filter(created_at__gte=today_start).count()
    
    return render(request, "jobs/jobs.html", {
        "jobs": jobs, 
        "status_choices": STATUS_CHOICES,
        "source_choices": SOURCE_CHOICES,
        "today_jobs_count": today_jobs_count,
        "daily_goal": DAILY_GOAL,
        "goal_reached": today_jobs_count >= DAILY_GOAL
    })

@require_http_methods(['PUT'])
def update_job_field(request, job_id):
    try:
        data = json.loads(request.body)
        # get the field name from data object { status: 'new_state' }
        field_name = list(data.keys())[0]
        valid_choices = STATUS_CHOICES if field_name == 'status' else SOURCE_CHOICES
        new_value = data.get(field_name)
        job = get_object_or_404(JobApplication, pk=job_id)
        
        # Check if the new value is valid
        if new_value in [choice[0] for choice in valid_choices]:
            setattr(job, field_name, new_value)
            job.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': f'Invalid {field_name}'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@require_POST
def add_step(request, job_id):
    try:
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        
        if not title or not description:
            return JsonResponse({'success': False, 'error': 'Title and description are required'}, status=400)

        job = get_object_or_404(JobApplication, pk=job_id)
        step = Step.objects.create(job_application=job, title=title, description=description)
        
        return JsonResponse({
            'success': True,
            'step': {
                'title': step.title,
                'description': step.description,
                'created_at': step.created_at.strftime('%Y-%m-%d %H:%M') # Format as needed, or just str()
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_POST
def add_job(request):
    try:
        data = json.loads(request.body)
        job_title = data.get('job_title')
        company_name = data.get('company_name')
        company_url = data.get('company_url')
        job_description = data.get('job_description')
        resume_version = data.get('resume_version')
        salary = data.get('salary', '')
        status = data.get('status', 'Applied')
        source = data.get('source', 'Careers Website')

        if not all([job_title, company_name, company_url, job_description, resume_version]):
             return JsonResponse({'success': False, 'error': 'All fields except salary are required'}, status=400)

        job = JobApplication.objects.create(
            job_title=job_title,
            company_name=company_name,
            company_url=company_url,
            job_description=job_description,
            resume_version=resume_version,
            salary=salary,
            status=status,
            source=source
        )

        return JsonResponse({
            'success': True,
            'job': {
                'id': job.id,
                'job_title': job.job_title,
                'company_name': job.company_name,
                'company_url': job.company_url,
                'job_description': job.job_description,
                'resume_version': job.resume_version,
                'status': job.status,
                'source': job.source,
                'created_at': job.created_at.strftime('%b. %d, %Y, %I:%M %p').replace('AM', 'a.m.').replace('PM', 'p.m.') # Match Django default template format roughly
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
