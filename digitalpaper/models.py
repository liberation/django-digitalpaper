# -*- coding: utf-8 -*-
from django.db import models
from django.conf import settings
from django.db.models.loading import get_model

MANAGER_FOR_PUBLICATION='libe.publication.objects'
MANAGER_FOR_BOOK='book_set' # must be a manager in the publication model
MANAGER_FOR_PAGE='paperpage_set' # must be a manager in the book model
MANAGERS_FOR_ZONE=('get_maps',) # muse be a manager in the page model

app_name, model_name, manager_name = MANAGER_FOR_PUBLICATION.split('.')
publication_model = get_model(app_name, model_name)
