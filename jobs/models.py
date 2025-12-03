from django.db import models

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('Applied', 'Applied'),
        ('Rejected', 'Rejected'),
        ('Technical Interview', 'Technical Interview'),
        ('HR Interview', 'HR Interview'),
        ('Offer', 'Offer'),
    ]
    job_title = models.CharField(max_length=100)
    salary = models.CharField(max_length=100, default='', blank=True)
    company_name = models.CharField(max_length=100)
    company_url = models.URLField()
    job_description = models.TextField()
    resume_version = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Applied')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
