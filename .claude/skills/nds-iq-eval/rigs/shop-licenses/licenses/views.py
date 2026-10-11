from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.vary import vary_on_headers

from .copy import lang_code, t
from .forms import ApplicationForm, DecisionForm
from .models import Activity, Application, Category, Status, StatusChange


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
    """staff/queue.html - context: page_obj (10 per page), status, q, statuses, counts (status -> n), total.
    With X-Fragment: 1, renders staff/_queue_results.html with the same context."""
    q = request.GET.get('q', '').strip()
    status = request.GET.get('status', '')
    if status not in Status.values:
        status = ''
    items = Application.objects.select_related('activity', 'district', 'owner')
    if status:
        items = items.filter(status=status)
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
        'counts': counts,
        'total': sum(counts.values()),
    })


@staff_required
@vary_on_headers('X-Fragment')
def staff_review(request, reference):
    """staff/review.html - context: application, history, form (DecisionForm). Saved: back to the queue.
    With X-Fragment: 1 a POST answers 204 + X-Redirect (valid) or 422 + staff/_decision_form.html (invalid)."""
    application = get_object_or_404(Application, reference=reference)
    if request.method == 'POST':
        form = DecisionForm(request.POST)
        if form.is_valid():
            decision = form.cleaned_data['decision']
            note = form.cleaned_data['note']
            application.status = decision
            if decision == Status.INSPECTION_SCHEDULED:
                application.inspection_date = form.cleaned_data['inspection_date']
            if decision == Status.REJECTED:
                application.reject_reason = note
            application.save()
            StatusChange.objects.create(application=application, status=decision, note=note)
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
