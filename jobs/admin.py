from django.contrib import admin

from .models import JobApplication, Step, JobBoard

admin.site.register(JobApplication)
admin.site.register(Step)
admin.site.register(JobBoard)
