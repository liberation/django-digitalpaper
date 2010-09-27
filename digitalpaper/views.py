# -*- coding: utf-8 -*-

from django.shortcuts import render_to_response, get_object_or_404, redirect
from django.core.urlresolvers import reverse
from django.template import RequestContext

from digitalpaper.models import publication_model

def reader_latest(request):
    pub = publication_model.objects.latest('pk')
    return redirect('digitalpaper_reader', publication_id=pub.pk)

def reader(request, publication_id):
    p = get_object_or_404(publication_model, pk=int(publication_id))
    context = {}
    context['publication'] = p
    return render_to_response('digitalpaper/reader.html', context, context_instance=RequestContext(request))
