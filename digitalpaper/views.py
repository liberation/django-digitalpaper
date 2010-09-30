# -*- coding: utf-8 -*-

from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.core.urlresolvers import reverse
from django.template import RequestContext

from digitalpaper import publication_model, \
                         get_manager_method_for_publication, \
                         get_publication_date_field

def reader_latest(request):
    pub = get_manager_method_for_publication(publication_model).latest()
    return redirect('digitalpaper_reader', publication_id=pub.pk)
    
def reader_date(request, date):
    manager = get_manager_method_for_publication(publication_model)
    filters = {}
    filters[get_publication_date_field()] = date
    pub = get_object_or_404(publication_model, **filters)    
    return redirect('digitalpaper_reader', publication_id=pub.pk)    

def reader(request, publication_id):
    pub = get_object_or_404(publication_model, pk=int(publication_id))
    context = {
        'publication': pub,
    }
    return render_to_response('digitalpaper/reader.html', context, context_instance=RequestContext(request))
