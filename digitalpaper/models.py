# -*- coding: utf-8 -*-
from django.db import models
from django.conf import settings


class BasePaperModel(models.Model):
    #TONOTICE @dlar Do we need to put this in settings to make it customizable ?
    PAPER_KIND = settings.PAPER_KIND
    
    publication_number = models.IntegerField(blank=True, null=True)
    paper_publication_date = models.DateField(editable=False, null=True)#TONOTICE @dbat publication_date without hours min and sec
    paper_kind = models.PositiveSmallIntegerField(choices=PAPER_KIND.CHOICES, blank=True, null=True)#TONOTICE @dbat Ancien nica_publication_source
    
    def can_read_special(self, perms):
        # Anything published in paper can be bought one number at a time, so there is
        # an additionnal can_read test for them, using the paper publication date
        #
        # FIXME: paper_publication_date=None can make sense for articles, which inherit from PaperModel
        # and therefore from BasePaperModel. For many other objects however, it doesn't make sense, should
        # we do something about it ?
        if not self.paper_publication_date:
            return False
        return perms.has_product(self.paper_publication_date)
    
    class Meta:
        abstract = True

class PaperModel(BasePaperModel):
    EDITION = ((1, "First Edition"), (2, "Second Edition"))
    PAPER_CHANNEL = settings.PAPER_CHANNEL
    BOOK_CODE = ((1, "National news"), (2, "International news"), (3, "Local news"))
    
    
    edition = models.PositiveSmallIntegerField(choices=EDITION, blank=True, null=True)
    paper_channel = models.PositiveSmallIntegerField(choices=PAPER_CHANNEL.CURRENT, blank=True, null=True)
    page_number = models.PositiveSmallIntegerField(blank=True, null=True)
    # Is book code really needed, as there is a relation between pages and book ?
    # Lets keep it for now, but we have to think about this later
    book_code = models.PositiveSmallIntegerField(choices=BOOK_CODE, blank=True, null=True)

    # Why this manager, here ?
#    objects = BaseManager()
    
    class Meta:
        abstract = True

class BaseBook(models.Model):
    CODE = ((1, "National news"), (2, "International news"), (3, "Local news"))
    
    code = models.PositiveSmallIntegerField(choices=CODE)
    name = models.CharField(blank=True, max_length=100)
    pages = models.PositiveSmallIntegerField()
    rank = models.PositiveSmallIntegerField(default=0)
    
    class Meta:
        abstract = True

class Book(BaseBook):
    publication = models.ForeignKey("Publication")

class BasePublication(BasePaperModel):
    PRODUCT = ((1, "Dailypaper"), (2, "Weekly"))
    
    product = models.PositiveSmallIntegerField(choices=PRODUCT, default=1)
    original_file = models.FileField(upload_to="publication/%Y/%m/%d", max_length=200)

    def __unicode__(self):
        return "%s (%s)" % (str(self.paper_publication_date), self.pk)
    
    class Meta:
        abstract = True

class Publication(BasePublication):
    pass

class BasePaperPage(PaperModel):
    original_file = models.FileField(upload_to="paper_page/%Y/%m/%d", max_length=200)

    class Meta:
        abstract = True
        ordering = (('page_number'),)

class PaperPage(BasePaperPage):
    book = models.ForeignKey(Book, blank=True, null=True)
    
