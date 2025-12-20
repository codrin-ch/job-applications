import json

from django.db import models

STATUS_CHOICES = [
    ("Preparing Application", "Preparing Application"),
    ("Applied", "Applied"),
    ("Ghosted", "Ghosted"),
    ("Avoid", "Avoid"),
    ("Rejected", "Rejected"),
    ("Technical Interview", "Technical Interview"),
    ("HR Interview", "HR Interview"),
    ("Offer", "Offer"),
]
SOURCE_CHOICES = [
    ("LinkedIn", "LinkedIn"),
    ("Careers Website", "Careers Website"),
    ("Other", "Other"),
]


class JobApplication(models.Model):
    job_title = models.CharField(max_length=100)
    salary = models.CharField(max_length=100, default="", blank=True)
    company_name = models.CharField(max_length=100)
    company_url = models.URLField()
    job_description = models.TextField()
    resume_version = models.CharField(max_length=100)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="Preparing Application")
    source = models.CharField(
        max_length=20, choices=SOURCE_CHOICES, default="Careers Website"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cover_letter = models.TextField(default="", blank=True)
    workflows = models.ManyToManyField(
        "Workflow", related_name="job_applications", blank=True
    )


class Step(models.Model):
    job_application = models.ForeignKey(
        JobApplication, on_delete=models.CASCADE, related_name="steps"
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ResearchDataCategories(models.IntegerChoices):
    RESPONSABILITY = 1
    REQUIREMENT = 2
    COMPANY_RESEARCH = 3
    ROLE_RESEARCH = 4


class ResearchData(models.Model):
    job_application = models.ForeignKey(
        JobApplication, on_delete=models.CASCADE, related_name="research_data"
    )
    category = models.IntegerField(choices=ResearchDataCategories.choices)
    info = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class JobBoard(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_visited = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class Workflow(models.Model):
    workflow_id = models.AutoField(primary_key=True)
    workflow_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    prompt = models.TextField()
    agent_model = models.CharField(max_length=200)
    output = models.TextField()
    parameters = models.TextField()

    def parseOutput(self):
        return json.loads(self.output)


class WorkExperience(models.Model):
    job_title = models.CharField(max_length=100)
    company_name = models.CharField(max_length=100)
    company_url = models.URLField()
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WorkAchievement(models.Model):
    work_experience = models.ForeignKey(
        WorkExperience, on_delete=models.CASCADE, related_name="work_achievements"
    )
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
