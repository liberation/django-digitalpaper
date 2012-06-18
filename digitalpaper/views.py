# -*- coding: utf-8 -*-

from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.http import Http404
from django.core.urlresolvers import reverse
from django.template import RequestContext
from datetime import datetime

from digitalpaper import get_model_for_publication, \
                         get_manager_for_publication, \
                         get_manager_method_for_publication_by_date, \
                         get_publication_date_field \

def reader_latest(request):
    publication_model = get_model_for_publication()
    pub = get_manager_for_publication(publication_model).latest()
    return redirect('digitalpaper_reader', publication_id=pub.pk)
    
def reader_date(request, date):
    publication_model = get_model_for_publication()
    method = get_manager_method_for_publication_by_date(publication_model)
    filters = {}
    filters[get_publication_date_field()] = datetime.strptime(date, '%Y-%m-%d')
    pub = method(**filters)
    if not pub:
        raise Http404
    
    return redirect('digitalpaper_reader', publication_id=pub.pk)

def reader(request, publication_id):
    publication_model = get_model_for_publication()
    manager = get_manager_for_publication(publication_model)
    pub = get_object_or_404(manager, pk=int(publication_id))
    context = {
        'publication': pub,
        'latest_publication' : get_manager_for_publication(publication_model).latest(),
        'first_publication'  : get_manager_for_publication(publication_model).reverse().latest()
    }
    return render_to_response('digitalpaper/reader.html', context, context_instance=RequestContext(request))
