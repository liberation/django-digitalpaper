# -*- coding: utf-8 -*-
from django.db.models import Model, loading
from django.conf import settings

def get_publication_date_field():
    return settings.READER_PUBLICATION_DATE_FIELD

def get_model_for_publication():
    return loading.get_model(settings.READER_PUBLICATION_APP_NAME, settings.READER_PUBLICATION_MODEL_NAME)
    
def get_manager_for_publication(inst):
    name = getattr(settings, 'READER_PUBLICATION_MANAGER_NAME', 'objects')
    manager = getattr(get_model_for_publication(), name)
    return manager

def get_manager_method_for_publication(inst):
    manager = get_manager_for_publication(inst)
    method = getattr(manager, settings.READER_PUBLICATION_MANAGER_METHOD_NAME)
    return method()
    
publication_model = get_model_for_publication()

