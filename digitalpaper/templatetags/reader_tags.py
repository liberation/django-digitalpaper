 # -*- coding: utf-8 -*-

from django import template
from django.utils.html import conditional_escape

from digitalpaper.utils import get_publication_date_field, get_model_for_paperpage


register = template.Library()


@register.filter
def get_publication_date(o):
    return getattr(o, get_publication_date_field())


@register.simple_tag
def paperpage_preview_absolute_url(paperpage, size='x148'):
    """
    Returns a correctly formatted absolute_url in order to print a paperpage preview.
    """
    if not paperpage:
        url = get_model_for_paperpage().get_page_under_construction_preview_url(size=size)
    else:
        url = paperpage.get_preview_absolute_url(size=size)
    return conditional_escape(url)


@register.simple_tag
def book_preview_absolute_url(book, size='x148'):
    """
    Returns a correctly formatted absolute_url in order to print a book preview.
    """
    if not book:
        url = get_model_for_paperpage().get_page_under_construction_preview_url(size=size)
    else:
        url = book.get_preview_absolute_url(size=size)
    return conditional_escape(url)


@register.simple_tag
def publication_preview_absolute_url(publication, size='x148'):
    """
    Returns a correctly formatted absolute_url in order to print a publication preview.
    """
    if not publication:
        # publication.get_preview_absolute_url knows how to handle a publication
        # with no PaperPage attached, but here we don't even have a Publication,
        # so take a shortcut and use PaperPage.get_page_under_construction_preview_url
        url = get_model_for_paperpage().get_page_under_construction_preview_url(size=size)
    else:
        url = publication.get_preview_absolute_url(size=size)
    return conditional_escape(url)
