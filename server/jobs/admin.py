from django.contrib import admin

from .models import JobApplication, JobBoard, Step

admin.site.register(JobApplication)
admin.site.register(Step)
admin.site.register(JobBoard)
