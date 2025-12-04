from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST
import json
from .models import JobApplication, Step

def jobs(request):
    queryset = JobApplication.objects.order_by('-created_at').values("job_title", "company_name", "company_url", "job_description", "resume_version", "salary", "status", "created_at")
    data = list(queryset)
    return JsonResponse(data, safe=False)


def jobs_list(request):
    from django.db.models import Case, When, IntegerField
    
    # Define status priority: Offer=1, Technical Interview=2, HR Interview=3, Applied=4, Ghosted=5, Rejected=6
    status_order = Case(
        When(status='Offer', then=1),
        When(status='Technical Interview', then=2),
        When(status='HR Interview', then=3),
        When(status='Applied', then=4),
        When(status='Ghosted', then=5),
        When(status='Rejected', then=6),
        output_field=IntegerField(),
    )
    
    jobs = JobApplication.objects.annotate(
        status_priority=status_order
    ).order_by('status_priority', '-created_at').prefetch_related('steps')
    
    return render(request, "jobs/jobs.html", {
        "jobs": jobs, 
        "status_choices": JobApplication.STATUS_CHOICES,
        "source_choices": JobApplication.SOURCE_CHOICES
    })

@require_POST
def update_job_status(request, job_id):
    try:
        data = json.loads(request.body)
        new_status = data.get('status')
        job = get_object_or_404(JobApplication, pk=job_id)
        
        # Check if the new status is a valid choice
        valid_statuses = [choice[0] for choice in JobApplication.STATUS_CHOICES]
        if new_status in valid_statuses:
            job.status = new_status
            job.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid status'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_POST
def update_job_source(request, job_id):
    try:
        data = json.loads(request.body)
        new_source = data.get('source')
        job = get_object_or_404(JobApplication, pk=job_id)
        
        # Check if the new source is a valid choice
        valid_sources = [choice[0] for choice in JobApplication.SOURCE_CHOICES]
        if new_source in valid_sources:
            job.source = new_source
            job.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid source'}, status=400)
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
