# -*- coding: utf-8 -*-

from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext

from digitalpaper.models import publication_model

def reader(request):
    p = get_object_or_404(publication_model, pk=316)
    context = {}
    context['publication'] = p
    return render_to_response('digitalpaper/reader.html', context, context_instance=RequestContext(request))
