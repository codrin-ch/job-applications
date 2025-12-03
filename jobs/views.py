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
    jobs = JobApplication.objects.order_by('-created_at').prefetch_related('steps')
    return render(request, "jobs/jobs.html", {"jobs": jobs, "status_choices": JobApplication.STATUS_CHOICES})

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
