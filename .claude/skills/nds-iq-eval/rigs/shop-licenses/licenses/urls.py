from django.urls import include, path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('activities/', views.activities, name='activities'),
    path('activities/<str:code>/', views.activity_detail, name='activity_detail'),
    path('accounts/extend/', views.extend_session, name='extend_session'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('applications/', views.my_applications, name='my_applications'),
    path('applications/new/', views.application_new, name='application_new'),
    path('applications/<str:reference>/', views.application_detail, name='application_detail'),
    path('staff/applications/', views.staff_queue, name='staff_queue'),
    path('staff/applications/<str:reference>/', views.staff_review, name='staff_review'),
    path('staff/applications/<str:reference>/move/', views.staff_move, name='staff_move'),
    path('staff/board/', views.staff_board, name='staff_board'),
    path('staff/inspections/', views.staff_inspections, name='staff_inspections'),
]
