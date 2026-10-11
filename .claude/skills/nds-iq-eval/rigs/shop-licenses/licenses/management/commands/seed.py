"""Demo data: 12 activities, 8 districts, 4 users, 31 applications. Safe to run again."""
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from licenses.models import Activity, Application, District, Status, StatusChange

User = get_user_model()

# code, ar, en, category, fee, health certificate, description ar, description en
ACTIVITIES = [
    ('RT-01', 'بقالة', 'Grocery store', 'retail', 600, False,
     'بيع المواد الغذائية المعلبة والمنتجات اليومية للأسر.', 'Sale of packaged food and everyday household goods.'),
    ('RT-02', 'محل عطور', 'Perfume shop', 'retail', 1200, False,
     'بيع العطور والبخور ومستلزماتها.', 'Sale of perfumes, incense and related items.'),
    ('RT-03', 'إكسسوارات الجوال', 'Phone accessories', 'retail', 800, False,
     'بيع أغطية وشواحن وملحقات الهواتف الذكية.', 'Sale of phone cases, chargers and smartphone accessories.'),
    ('FD-01', 'مخبز', 'Bakery', 'food', 1500, True,
     'إنتاج وبيع الخبز والمعجنات الطازجة.', 'Production and sale of fresh bread and pastries.'),
    ('FD-02', 'مقهى', 'Café', 'food', 2000, True,
     'تقديم المشروبات الساخنة والباردة والحلويات الخفيفة.', 'Serving hot and cold drinks and light desserts.'),
    ('FD-03', 'مطعم', 'Restaurant', 'food', 2500, True,
     'تحضير وتقديم الوجبات داخل المحل أو للتوصيل.', 'Preparing and serving meals for dine-in or delivery.'),
    ('SV-01', 'مغسلة ملابس', 'Laundry', 'services', 900, False,
     'غسل وكي الملابس وتسليمها للعملاء.', 'Washing and ironing clothes and handing them back to customers.'),
    ('SV-02', 'صالون حلاقة رجالي', "Men's barber shop", 'services', 700, False,
     'خدمات حلاقة الشعر والعناية باللحية.', 'Haircuts and beard care.'),
    ('SV-03', 'صيانة جوالات', 'Phone repair', 'services', 500, False,
     'إصلاح الهواتف الذكية وتبديل الشاشات والبطاريات.', 'Smartphone repair, including screen and battery replacement.'),
    ('CR-01', 'خياطة', 'Tailoring', 'crafts', 300, False,
     'تفصيل وتعديل الملابس الرجالية والنسائية.', "Making and altering men's and women's clothes."),
    ('CR-02', 'نجارة', 'Carpentry', 'crafts', 1100, False,
     'تصنيع وإصلاح الأثاث والأبواب الخشبية.', 'Making and repairing wooden furniture and doors.'),
    ('CR-03', 'ورشة فخار', 'Pottery workshop', 'crafts', 400, False,
     'صناعة وبيع الأواني والتحف الفخارية.', 'Making and selling pottery vessels and decorative pieces.'),
]

DISTRICTS = [
    ('الروضة', 'Al-Rawda'), ('النخيل', 'Al-Nakheel'), ('الياسمين', 'Al-Yasmin'), ('الصفا', 'Al-Safa'),
    ('المروج', 'Al-Murooj'), ('الربوة', 'Al-Rabwa'), ('العزيزية', 'Al-Aziziyah'), ('الشفا', 'Al-Shifa'),
]

# Shop-name prefix per activity (ar, en), used for the generated applications
PREFIX = {
    'RT-01': ('بقالة', 'Grocery'), 'RT-02': ('عطور', 'Perfumes'), 'RT-03': ('جوال', 'Mobile'),
    'FD-01': ('مخبز', 'Bakery'), 'FD-02': ('مقهى', 'Café'), 'FD-03': ('مطعم', 'Restaurant'),
    'SV-01': ('مغسلة', 'Laundry'), 'SV-02': ('صالون', 'Salon'), 'SV-03': ('صيانة', 'Repair'),
    'CR-01': ('خياطة', 'Tailoring'), 'CR-02': ('نجارة', 'Carpentry'), 'CR-03': ('فخار', 'Pottery'),
}
NAMES = [
    ('النور', 'Al-Noor'), ('السلام', 'Al-Salam'), ('الأمل', 'Al-Amal'), ('البركة', 'Al-Baraka'),
    ('الفجر', 'Al-Fajr'), ('الريان', 'Al-Rayyan'), ('الهدى', 'Al-Huda'), ('الخير', 'Al-Khair'),
    ('الشروق', 'Al-Shurooq'), ('الوفاء', 'Al-Wafa'), ('اللؤلؤة', 'Al-Lulu'), ('الندى', 'Al-Nada'),
]

REJECT_REASONS = [
    'عقد الإيجار غير ساري المفعول، يرجى إرفاق عقد حديث.',
    'مخطط المحل غير واضح، يرجى إرفاق مخطط بمقياس رسم.',
    'رقم السجل التجاري لا يطابق النشاط المطلوب.',
]
NOTES = {
    Status.SUBMITTED: 'تم استلام الطلب.',
    Status.UNDER_REVIEW: 'بدأت مراجعة المستندات.',
    Status.INSPECTION_SCHEDULED: 'تم تحديد موعد معاينة الموقع.',
    Status.APPROVED: 'تم اعتماد الطلب.',
}
PATHS = {
    Status.SUBMITTED: [Status.SUBMITTED],
    Status.UNDER_REVIEW: [Status.SUBMITTED, Status.UNDER_REVIEW],
    Status.INSPECTION_SCHEDULED: [Status.SUBMITTED, Status.UNDER_REVIEW, Status.INSPECTION_SCHEDULED],
    Status.APPROVED: [Status.SUBMITTED, Status.UNDER_REVIEW, Status.INSPECTION_SCHEDULED, Status.APPROVED],
    Status.REJECTED: [Status.SUBMITTED, Status.UNDER_REVIEW, Status.REJECTED],
}

# The applicant's 7 applications: shop ar, shop en, activity, district index, m2, status, days ago
APPLICANT_APPS = [
    ('بقالة النخبة', 'Elite Grocery', 'RT-01', 1, 45, Status.APPROVED, 62),
    ('عطور الدانة', '', 'RT-02', 0, 30, Status.UNDER_REVIEW, 9),
    ('مقهى الغيمة', 'Ghayma Café', 'FD-02', 2, 60, Status.INSPECTION_SCHEDULED, 21),
    ('مخبز السنابل', '', 'FD-01', 3, 80, Status.REJECTED, 40),
    ('مغسلة الندى', 'Nada Laundry', 'SV-01', 4, 55, Status.APPROVED, 90),
    ('صيانة جوالات المدينة', '', 'SV-03', 5, 25, Status.SUBMITTED, 3),
    ('تفصيل الأناقة', 'Elegance Tailoring', 'CR-01', 6, 35, Status.UNDER_REVIEW, 12),
]


def pdf_bytes(title):
    """A one-page blank PDF, small but well formed."""
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
        b'<< /Title (' + title.encode('ascii') + b') >>',
    ]
    out = b'%PDF-1.4\n'
    offsets = []
    for i, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += f'{i} 0 obj\n'.encode() + body + b'\nendobj\n'
    xref = len(out)
    out += f'xref\n0 {len(objects) + 1}\n0000000000 65535 f \n'.encode()
    out += b''.join(f'{o:010d} 00000 n \n'.encode() for o in offsets)
    out += f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R /Info 4 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()
    return out


class Command(BaseCommand):
    help = 'Recreate the demo data (activities, districts, users, applications).'

    @transaction.atomic
    def handle(self, *args, **options):
        rng = random.Random(7)
        now = timezone.now()

        for application in Application.objects.all():
            application.floor_plan.delete(save=False)
            application.lease_contract.delete(save=False)
        Application.objects.all().delete()
        StatusChange.objects.all().delete()
        Activity.objects.all().delete()
        District.objects.all().delete()
        User.objects.filter(username__in=['applicant', 'newcomer', 'reviewer', 'others']).delete()

        activities = {row[0]: Activity.objects.create(
            code=row[0], name_ar=row[1], name_en=row[2], category=row[3], fee_sar=row[4],
            needs_health_certificate=row[5], description_ar=row[6], description_en=row[7],
        ) for row in ACTIVITIES}
        districts = [District.objects.create(name_ar=ar, name_en=en) for ar, en in DISTRICTS]

        def make_user(username, password, first, last, **extra):
            user = User(username=username, first_name=first, last_name=last, **extra)
            user.set_password(password) if password else user.set_unusable_password()
            user.save()
            return user

        applicant = make_user('applicant', 'applicant123', 'سارة', 'القحطاني')
        make_user('newcomer', 'newcomer123', 'خالد', 'الحربي')
        make_user('reviewer', 'reviewer123', 'نورة', 'العتيبي', is_staff=True)
        others = make_user('others', None, 'فهد', 'الدوسري')

        plan = []
        for ar, en, code, district, area, status, days in APPLICANT_APPS:
            plan.append(dict(owner=applicant, ar=ar, en=en, code=code, district=districts[district],
                             area=area, status=status, created=now - timedelta(days=days, hours=rng.randint(0, 8))))
        statuses = [Status.SUBMITTED, Status.UNDER_REVIEW, Status.INSPECTION_SCHEDULED, Status.APPROVED, Status.REJECTED]
        for _ in range(24):
            code = rng.choice(list(activities))
            name_ar, name_en = rng.choice(NAMES)
            prefix_ar, prefix_en = PREFIX[code]
            plan.append(dict(
                owner=others, ar=f'{prefix_ar} {name_ar}',
                en=f'{name_en} {prefix_en}' if rng.random() < 0.4 else '',
                code=code, district=rng.choice(districts),
                area=rng.randint(25, 300),
                status=rng.choices(statuses, weights=[8, 10, 6, 9, 5])[0],
                created=now - timedelta(days=rng.randint(10, 150), hours=rng.randint(0, 8)),
            ))

        # Oldest first, so the references run in date order
        plan.sort(key=lambda p: p['created'])
        for n, p in enumerate(plan):
            application = Application(
                owner=p['owner'], shop_name_ar=p['ar'], shop_name_en=p['en'], activity=activities[p['code']],
                cr_number='7' + ''.join(rng.choices('0123456789', k=9)), district=p['district'],
                area_m2=p['area'], opening_date=(p['created'] + timedelta(days=30)).date(),
                phone='05' + ''.join(rng.choices('0123456789', k=8)), status=p['status'],
            )
            application.floor_plan.save(f'floor-plan-{n}.pdf', ContentFile(pdf_bytes('Floor plan')), save=False)
            application.lease_contract.save(f'lease-{n}.pdf', ContentFile(pdf_bytes('Lease contract')), save=False)
            if p['status'] == Status.INSPECTION_SCHEDULED:
                days_ahead = 7 if p['owner'] == applicant else rng.randint(1, 10)
                application.inspection_date = (now + timedelta(days=days_ahead)).replace(hour=10, minute=0, second=0, microsecond=0)
            if p['status'] == Status.REJECTED:
                application.reject_reason = rng.choice(REJECT_REASONS) if p['owner'] != applicant else REJECT_REASONS[0]
            application.save()
            Application.objects.filter(pk=application.pk).update(created_at=p['created'])

            at = p['created']
            path = PATHS[p['status']]
            for i, status in enumerate(path):
                note = application.reject_reason if status == Status.REJECTED else NOTES[status]
                StatusChange.objects.create(application=application, status=status, note=note, at=at)
                at += timedelta(days=rng.randint(1, 2), hours=rng.randint(0, 5))
            if p['owner'] == applicant and len(path) == 1:
                # keep the applicant's histories at 2-4 rows: a second note while the application waits
                StatusChange.objects.create(application=application, status=Status.SUBMITTED,
                                            note='تم استلام المستندات بنجاح وبانتظار التعيين للمراجعة.', at=at)

        self.stdout.write(self.style.SUCCESS(
            f'{Activity.objects.count()} activities, {District.objects.count()} districts, '
            f'{User.objects.count()} users, {Application.objects.count()} applications'))
