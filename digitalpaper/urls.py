# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

urlpatterns = patterns('digitalpaper.views',
    url(r'^reader/(?P<publication_id>[\d]+)/$', 'reader', name='digitalpaper_reader'),
    url(r'^reader/date/(?P<date>\d{4}-\d{2}-\d{2})/$', 'reader_date', name='digitalpaper_reader_date'),    
    url(r'^reader/$', 'reader_latest', name='digitalpaper_reader_latest'),    
)
