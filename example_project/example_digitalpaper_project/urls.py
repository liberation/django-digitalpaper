from django.conf.urls.defaults import *
from django.contrib import admin
from django.conf import settings

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^digitalpaper/', include('digitalpaper.urls')),
    url(r'^app/', include('example_digitalpaper_project.example_app.urls')),

    # auth
    url(r'^auth/', include('django.contrib.auth.urls')),

    #  admin stuff
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    urlpatterns += patterns(
        'django.views.static',
        url(r'^media/(?P<path>.*)$', 'serve',
            {'document_root': settings.MEDIA_ROOT}),
        url(r'^static/(?P<path>.*)$', 'serve',
            {'document_root': settings.STATIC_ROOT}),
        )
