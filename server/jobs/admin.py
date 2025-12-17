from django.contrib import admin

from .models import JobApplication, JobBoard, ResearchData, Step, Workflow

admin.site.register(JobApplication)
admin.site.register(Step)
admin.site.register(JobBoard)
admin.site.register(Workflow)
admin.site.register(ResearchData)
