from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

from licenses import views as licenses_views

urlpatterns = [
    path('', RedirectView.as_view(url='/ar/', permanent=False)),
    path('i18n/', include('django.conf.urls.i18n')),
    path('admin/', admin.site.urls),
    path('api/activities/<str:code>/fee', licenses_views.activity_fee, name='activity_fee'),
]

urlpatterns += i18n_patterns(
    path('', include('licenses.urls')),
    prefix_default_language=True,
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
