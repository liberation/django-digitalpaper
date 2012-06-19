 # -*- coding: utf-8 -*-

from django import template
from django.utils.html import conditional_escape

from digitalpaper.utils import get_publication_date_field

register = template.Library()

@register.filter
def get_publication_date(o):
    return getattr(o, get_publication_date_field())

@register.simple_tag
def paperpage_preview_absolute_url(paperpage, size='x148'):
    if not paperpage:
        return ""
    return conditional_escape(paperpage.get_preview_absolute_url(size=size))

@register.simple_tag
def publication_preview_absolute_url(publication, size='x148'):
    if not publication:
        return ""
    return conditional_escape(publication.get_preview_absolute_url(size=size))