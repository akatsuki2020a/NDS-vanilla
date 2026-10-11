from django.conf import settings
from django.db import models
from django.utils import timezone

from .copy import COPY


def _options(enum, prefix, lang):
    return [{'value': c.value, 'label': COPY[lang][f'{prefix}_{c.value}']} for c in enum]


class Category(models.TextChoices):
    RETAIL = 'retail', COPY['en']['category_retail']
    FOOD = 'food', COPY['en']['category_food']
    SERVICES = 'services', COPY['en']['category_services']
    CRAFTS = 'crafts', COPY['en']['category_crafts']

    @classmethod
    def options(cls, lang):
        """[{'value', 'label'}] in the given language, for filters."""
        return _options(cls, 'category', lang)


class Status(models.TextChoices):
    SUBMITTED = 'submitted', COPY['en']['status_submitted']
    UNDER_REVIEW = 'under_review', COPY['en']['status_under_review']
    INSPECTION_SCHEDULED = 'inspection_scheduled', COPY['en']['status_inspection_scheduled']
    APPROVED = 'approved', COPY['en']['status_approved']
    REJECTED = 'rejected', COPY['en']['status_rejected']

    @classmethod
    def options(cls, lang):
        """[{'value', 'label'}] in the given language, for filters."""
        return _options(cls, 'status', lang)


class Activity(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=Category.choices)
    fee_sar = models.PositiveIntegerField()
    needs_health_certificate = models.BooleanField(default=False)
    description_ar = models.TextField()
    description_en = models.TextField()

    class Meta:
        ordering = ['id']
        verbose_name_plural = 'activities'

    def __str__(self):
        return f'{self.code} {self.name_en}'

    def label(self, lang):
        return self.name_ar if lang == 'ar' else self.name_en

    def description(self, lang):
        return self.description_ar if lang == 'ar' else self.description_en


class District(models.Model):
    name_ar = models.CharField(max_length=60)
    name_en = models.CharField(max_length=60)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name_en

    def label(self, lang):
        return self.name_ar if lang == 'ar' else self.name_en


class Application(models.Model):
    reference = models.CharField(max_length=20, unique=True, editable=False, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    shop_name_ar = models.CharField(max_length=60)
    shop_name_en = models.CharField(max_length=60, blank=True)
    activity = models.ForeignKey(Activity, on_delete=models.PROTECT)
    cr_number = models.CharField(max_length=10)
    district = models.ForeignKey(District, on_delete=models.PROTECT)
    area_m2 = models.PositiveIntegerField()
    opening_date = models.DateField()
    floor_plan = models.FileField(upload_to='plans/')
    lease_contract = models.FileField(upload_to='leases/')
    phone = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.SUBMITTED)
    inspection_date = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return self.reference

    def label(self, lang):
        """Shop name in the language; falls back to Arabic when there is no English name."""
        return self.shop_name_en if lang == 'en' and self.shop_name_en else self.shop_name_ar

    def save(self, *args, **kwargs):
        if not self.reference:
            # ponytail: max+1 is not safe under concurrent submits; use a DB sequence if that matters
            prefix = f'LIC-{timezone.localdate().year}-'
            last = Application.objects.filter(reference__startswith=prefix).order_by('-reference').first()
            number = int(last.reference[len(prefix):]) + 1 if last else 1
            self.reference = f'{prefix}{number:04d}'
        super().save(*args, **kwargs)


class StatusChange(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=30, choices=Status.choices)
    note = models.TextField(blank=True)
    at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['at', 'id']

    def __str__(self):
        return f'{self.application_id} {self.status}'
