from django.contrib import admin

from .models import Activity, Application, District, StatusChange

admin.site.register(Activity)
admin.site.register(District)
admin.site.register(Application)
admin.site.register(StatusChange)
