from django.urls import path

from . import views

urlpatterns = [
    path(
        "update_job_field/<int:job_id>/",
        views.update_job_field,
        name="update_job_field",
    ),
    path("add_step/<int:job_id>/", views.add_step, name="add_step"),
    path("add_job/", views.add_job, name="add_job"),
    path("add_job_board/", views.add_job_board, name="add_job_board"),
    path(
        "update_last_visited/<int:board_id>/",
        views.update_last_visited,
        name="update_last_visited",
    ),
    path("api/job-boards/", views.get_job_boards, name="get_job_boards"),
    path("api/jobs/", views.get_jobs, name="get_jobs"),
]
