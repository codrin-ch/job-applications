from django.urls import path

from . import views

urlpatterns = [
    path("", views.jobs_list, name="index"),
    path("jobapplications/", views.jobs, name="jobapplication"),
    path("update_status/<int:job_id>/", views.update_job_status, name="update_status"),
]
