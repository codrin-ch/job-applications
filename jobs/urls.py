from django.urls import path

from . import views

urlpatterns = [
    path("", views.jobs_list, name="index"),
    path("jobapplications/", views.jobs, name="jobapplication"),
    path("update_job_field/<int:job_id>/", views.update_job_field, name="update_job_field"),
    path("add_step/<int:job_id>/", views.add_step, name="add_step"),
    path("add_job/", views.add_job, name="add_job"),
]
