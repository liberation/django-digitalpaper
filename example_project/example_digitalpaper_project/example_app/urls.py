from django.conf.urls.defaults import *

urlpatterns = patterns('example_digitalpaper_project.example_app.views',
    url(r'^settings/', 'reader_settings', name='reader_settings'),
    url(r'^token/', 'reader_token', name='reader_token'),
    url(r'^publication/(?P<id>\d+)', 'reader_publication', name='reader_publication'),
    url(r'^reader_page_resized/(?P<id>\d+)', 'reader_page_resized', name='reader_page_resized'),
)