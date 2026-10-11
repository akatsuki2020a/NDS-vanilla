import re
from datetime import date, datetime, time, timedelta
from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.views.decorators.vary import vary_on_headers

from .copy import lang_code, t
from .forms import ApplicationForm, DecisionForm, MoveForm
from .models import Activity, Application, Category, District, Status, StatusChange


def staff_required(view):
    """Signed-out users go to login; signed-in non-staff get a 403."""
    @login_required
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_staff:
            raise PermissionDenied
        return view(request, *args, **kwargs)
    return wrapper


def wants_fragment(request):
    """True when the page asked for the HTML fragment only (header X-Fragment: 1)."""
    return request.headers.get('X-Fragment') == '1'


def home(request):
    """licenses/home.html - context: featured (4 activities, one per category)."""
    featured = Activity.objects.filter(code__endswith='-01')
    return render(request, 'licenses/home.html', {'featured': featured})


@vary_on_headers('X-Fragment')
def activities(request):
    """licenses/activities.html - context: page_obj (6 per page), q, category, categories, total.
    With X-Fragment: 1, renders licenses/_activities_results.html with the same context."""
    q = request.GET.get('q', '').strip()
    category = request.GET.get('category', '')
    if category not in Category.values:
        category = ''
    items = Activity.objects.all()
    if category:
        items = items.filter(category=category)
    if q:
        items = items.filter(Q(name_ar__icontains=q) | Q(name_en__icontains=q) | Q(code__icontains=q))
    paginator = Paginator(items, 6)
    template = 'licenses/_activities_results.html' if wants_fragment(request) else 'licenses/activities.html'
    return render(request, template, {
        'page_obj': paginator.get_page(request.GET.get('page')),
        'q': q,
        'category': category,
        'categories': Category.options(lang_code()),
        'total': paginator.count,
    })


def activity_fee(request, code):
    """JSON (no template): {code, fee_sar, needs_health_certificate}, or 404 {error: not_found}."""
    activity = Activity.objects.filter(code=code).first()
    if not activity:
        return JsonResponse({'error': 'not_found'}, status=404)
    return JsonResponse({
        'code': activity.code,
        'fee_sar': activity.fee_sar,
        'needs_health_certificate': activity.needs_health_certificate,
    })


def activity_detail(request, code):
    """licenses/activity_detail.html - context: activity. Unknown code is a 404."""
    activity = get_object_or_404(Activity, code=code)
    return render(request, 'licenses/activity_detail.html', {'activity': activity})


@login_required
def my_applications(request):
    """licenses/my_applications.html - context: applications (the user's own, newest first)."""
    applications = Application.objects.filter(owner=request.user).select_related('activity', 'district')
    return render(request, 'licenses/my_applications.html', {'applications': applications})


@login_required
def application_new(request):
    """licenses/application_form.html - context: form. ?activity=<code> preselects the activity."""
    if request.method == 'POST':
        form = ApplicationForm(request.POST, request.FILES)
        if form.is_valid():
            application = form.save(commit=False)
            application.owner = request.user
            application.save()
            StatusChange.objects.create(application=application, status=Status.SUBMITTED)
            messages.success(request, t('form_success', reference=application.reference))
            return redirect('application_detail', reference=application.reference)
    else:
        initial = {}
        preselected = Activity.objects.filter(code=request.GET.get('activity', '')).first()
        if preselected:
            initial['activity'] = preselected.pk
        form = ApplicationForm(initial=initial)
    return render(request, 'licenses/application_form.html', {'form': form})


@login_required
def application_detail(request, reference):
    """licenses/application_detail.html - context: application, history. Not yours or unknown: 404."""
    application = get_object_or_404(Application, reference=reference, owner=request.user)
    return render(request, 'licenses/application_detail.html', {
        'application': application,
        'history': application.history.all(),
    })


@staff_required
@vary_on_headers('X-Fragment')
def staff_queue(request):
    """staff/queue.html - context: page_obj (10 per page), status, district, q, statuses, districts, counts (status -> n), total.
    With X-Fragment: 1, renders staff/_queue_results.html with the same context."""
    q = request.GET.get('q', '').strip()
    status = request.GET.get('status', '')
    if status not in Status.values:
        status = ''
    districts = District.objects.all()
    district = request.GET.get('district', '')
    if district not in [str(d.pk) for d in districts]:
        district = ''
    items = Application.objects.select_related('activity', 'district', 'owner')
    if status:
        items = items.filter(status=status)
    if district:
        items = items.filter(district_id=district)
    if q:
        items = items.filter(Q(reference__icontains=q) | Q(shop_name_ar__icontains=q) | Q(shop_name_en__icontains=q))
    counts = dict.fromkeys(Status.values, 0)
    # order_by() clears Meta.ordering, which would otherwise split the groups
    counts.update({r['status']: r['n'] for r in Application.objects.values('status').annotate(n=Count('id')).order_by()})
    template = 'staff/_queue_results.html' if wants_fragment(request) else 'staff/queue.html'
    return render(request, template, {
        'page_obj': Paginator(items, 10).get_page(request.GET.get('page')),
        'status': status,
        'q': q,
        'statuses': Status.options(lang_code()),
        'district': district,
        'districts': [{'value': str(d.pk), 'label': d.label(lang_code())} for d in districts],
        'counts': counts,
        'total': sum(counts.values()),
    })


def apply_decision(application, status, inspection_date, note):
    """Set the new status on the application and write one StatusChange."""
    application.status = status
    if status == Status.INSPECTION_SCHEDULED:
        application.inspection_date = inspection_date
    if status == Status.REJECTED:
        application.reject_reason = note
    application.save()
    StatusChange.objects.create(application=application, status=status, note=note)


@staff_required
@vary_on_headers('X-Fragment')
def staff_review(request, reference):
    """staff/review.html - context: application, history, form (DecisionForm). Saved: back to the queue.
    With X-Fragment: 1 a POST answers 204 + X-Redirect (valid) or 422 + staff/_decision_form.html (invalid)."""
    application = get_object_or_404(Application, reference=reference)
    if request.method == 'POST':
        form = DecisionForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            apply_decision(application, data['decision'], data['inspection_date'], data['note'])
            messages.success(request, t('review_success', reference=application.reference))
            if wants_fragment(request):
                response = HttpResponse(status=204)
                response['X-Redirect'] = reverse('staff_queue')
                return response
            return redirect('staff_queue')
        if wants_fragment(request):
            return render(request, 'staff/_decision_form.html', {'form': form, 'application': application}, status=422)
    else:
        form = DecisionForm(initial={'decision': application.status})
    return render(request, 'staff/review.html', {
        'application': application,
        'history': application.history.all(),
        'form': form,
    })


@staff_required
def staff_board(request):
    """staff/board.html - context: columns, one per status in order, each
    {status, label, count, applications (newest 20)}."""
    columns = []
    for option in Status.options(lang_code()):
        items = Application.objects.filter(status=option['value']).select_related('activity', 'district')
        columns.append({
            'status': option['value'],
            'label': option['label'],
            'count': items.count(),
            'applications': list(items[:20]),
        })
    return render(request, 'staff/board.html', {'columns': columns})


@staff_required
@require_POST
@vary_on_headers('X-Fragment')
def staff_move(request, reference):
    """POST fields: to, inspection_date (for inspection_scheduled), note (for rejected).
    With X-Fragment: 1: valid is 200 + staff/_board_card.html (application) + X-Column: <new status>;
    invalid is 422 + staff/_move_form.html (form, application). Without it: redirect to the board,
    or the board again with an error message."""
    application = get_object_or_404(Application, reference=reference)
    form = MoveForm(request.POST, application=application)
    if form.is_valid():
        data = form.cleaned_data
        apply_decision(application, data['to'], data['inspection_date'], data['note'])
        if wants_fragment(request):
            response = render(request, 'staff/_board_card.html', {'application': application})
            response['X-Column'] = application.status
            return response
        messages.success(request, t('move_success', reference=application.reference,
                                    status=t('status_' + application.status)))
        return redirect('staff_board')
    if wants_fragment(request):
        return render(request, 'staff/_move_form.html', {'form': form, 'application': application}, status=422)
    messages.error(request, ' '.join(m for errors in form.errors.values() for m in errors))
    return staff_board(request)


def parse_week(value):
    """'YYYY-Www' -> the Sunday that starts that week (Sunday to Saturday around the ISO Monday), or None."""
    match = re.fullmatch(r'(\d{4})-W(\d{2})', value or '')
    try:
        return date.fromisocalendar(int(match[1]), int(match[2]), 1) - timedelta(days=1) if match else None
    except ValueError:
        return None


def week_key(sunday):
    year, week, _ = (sunday + timedelta(days=1)).isocalendar()
    return f'{year}-W{week:02d}'


@staff_required
def staff_inspections(request):
    """staff/inspections.html - context: week_label, days (Sunday to Saturday, each {date, is_today,
    inspections: [{time, reference, shop, district, url}]}), prev_week, next_week, this_week.
    ?week=YYYY-Www, default this week."""
    lang = lang_code()
    today = timezone.localdate()
    this_sunday = today - timedelta(days=(today.weekday() + 1) % 7)
    sunday = parse_week(request.GET.get('week')) or this_sunday
    start = timezone.make_aware(datetime.combine(sunday, time.min))
    booked = Application.objects.filter(
        status=Status.INSPECTION_SCHEDULED, inspection_date__gte=start, inspection_date__lt=start + timedelta(days=7),
    ).select_related('district').order_by('inspection_date', 'reference')
    days = [{'date': sunday + timedelta(days=n), 'is_today': sunday + timedelta(days=n) == today, 'inspections': []}
            for n in range(7)]
    for application in booked:
        when = timezone.localtime(application.inspection_date)
        days[(when.date() - sunday).days]['inspections'].append({
            'time': when.strftime('%H:%M'),
            'reference': application.reference,
            'shop': application.label(lang),
            'district': application.district.label(lang),
            'url': reverse('staff_review', args=[application.reference]),
        })
    return render(request, 'staff/inspections.html', {
        'week_label': f'{days[0]["date"]:%Y-%m-%d} – {days[6]["date"]:%Y-%m-%d}',
        'days': days,
        'prev_week': week_key(sunday - timedelta(days=7)),
        'next_week': week_key(sunday + timedelta(days=7)),
        'this_week': week_key(this_sunday),
    })


@login_required
@require_POST
def extend_session(request):
    """No template. Answers 204; the request itself refreshes the session (SESSION_SAVE_EVERY_REQUEST)."""
    return HttpResponse(status=204)
