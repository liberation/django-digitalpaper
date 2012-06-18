 # -*- coding: utf-8 -*-

from django import template
from digitalpaper.utils import get_publication_date_field

register = template.Library()

@register.filter
def get_publication_date(o):
    return getattr(o, get_publication_date_field())

