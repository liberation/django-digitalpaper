# -*- coding: utf-8 -*-
from django.conf import settings
from django.db import models

class AbstractDigitalPaperPage(models.Model):
    class Meta:
        abstract = True


    def get_preview_absolute_url(self, size='x148'):
        """
        Return the url corresponding to the preview image for the PaperPage
        at the given size.
        """
        pass

    @classmethod
    def get_page_under_construction_preview_url(cls, size="x148"):
        """
        Return the image corresponding to a page under construction
        """
        if size == 'x50':
            img = 'digitalpaper/img/page_under_construction_smallest.png'
        else:
            img = 'digitalpaper/img/page_under_construction.png'
        return '%s%s' % (settings.STATIC_URL, img)

    @classmethod
    def get_page_restricted_to_subscribers_preview_url(cls, size="x148"):
        """
        Return the image corresponding to a page restricted for subscribers
        """
        img = 'digitalpaper/img/page-only-subscribers.png'
        return '%s%s' % (settings.STATIC_URL, img)


class AbstractDigitalPublication(models.Model):
    class Meta:
        abstract = True


    def get_preview_absolute_url(self, size='x250'):
        """
        Return the url corresponding to the preview image for the Publication
        at the given size. Usually, it will be the preview for the first PaperPage
        attached to that publication.
        """
        pass