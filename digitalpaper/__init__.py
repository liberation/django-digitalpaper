# -*- coding: utf-8 -*-
from django.db import models
from django.db.models.loading import get_model
from django.conf import settings
from django.http import HttpResponse

MANAGER_FOR_PUBLICATION='libe.publication.objects'
MANAGER_FOR_BOOK='book_set' # must be a manager in the publication model
MANAGER_FOR_PAGE='paperpage_set' # must be a manager in the book model
MANAGERS_FOR_ZONE=('get_maps',) # muse be a manager in the page model

def get_manager(thing, manager_name, request):
    manager = getattr(thing, manager_name)
    if callable(manager):
        manager = manager(request)
    return manager

def testview(request):
    html = ''
    app_name, model_name, manager_name = MANAGER_FOR_PUBLICATION.split('.')
    publication_model = get_model(app_name, model_name)
    publication_manager = get_manager(publication_model, manager_name, request)
    for publication in publication_manager.all():
        book_manager = get_manager(publication, MANAGER_FOR_BOOK, request)
        for book in book_manager.all():
            page_manager = get_manager(book, MANAGER_FOR_PAGE, request)
            for page in page_manager.all():
                for zone_manager_name in MANAGERS_FOR_ZONE:
                    zone_manager = get_manager(page, zone_manager_name, request)
                    for zone in zone_manager: #.all() ! FIXME
                        html += '%s => %s => %s => %s => %s<br>'%(
                            publication, book, page, zone_manager_name, zone)
    return HttpResponse(html)

"""
JSON =
  structure +
  


regarder si le manager est callable ;
- si oui : l'appeler en passant la request comme argument
- si non : l'utiliser tel quel



"""

