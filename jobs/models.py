from django.db import models

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('Applied', 'Applied'),
        ('Ghosted', 'Ghosted'),
        ('Rejected', 'Rejected'),
        ('Technical Interview', 'Technical Interview'),
        ('HR Interview', 'HR Interview'),
        ('Offer', 'Offer'),
    ]
    SOURCE_CHOICES = [
        ('LinkedIn', 'LinkedIn'),
        ('Careers Website', 'Careers Website'),
        ('Other', 'Other'),
    ]
    job_title = models.CharField(max_length=100)
    salary = models.CharField(max_length=100, default='', blank=True)
    company_name = models.CharField(max_length=100)
    company_url = models.URLField()
    job_description = models.TextField()
    resume_version = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='Careers Website')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Step(models.Model):
    job_application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='steps')
    title = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
