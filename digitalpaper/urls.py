# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

urlpatterns = patterns('digitalpaper.views',
    url(r'^reader/(?P<publication_id>[\d]+)/$', 'reader', name='digitalpaper_reader'),
)
