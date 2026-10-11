from django.urls import include, path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('activities/', views.activities, name='activities'),
    path('activities/<str:code>/', views.activity_detail, name='activity_detail'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('applications/', views.my_applications, name='my_applications'),
    path('applications/new/', views.application_new, name='application_new'),
    path('applications/<str:reference>/', views.application_detail, name='application_detail'),
    path('staff/applications/', views.staff_queue, name='staff_queue'),
    path('staff/applications/<str:reference>/', views.staff_review, name='staff_review'),
]
