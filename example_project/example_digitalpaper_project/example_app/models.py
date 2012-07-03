from django.db import models

from digitalpaper.models import AbstractDigitalPaperPage, AbstractDigitalPublication

# Create your models here.

class Publication(AbstractDigitalPublication):
    original_file = models.FileField(upload_to="publication/%Y/%m/%d", max_length=255, verbose_name=u"PDF File")
    publication_date = models.DateField(db_index=True, auto_now_add=True)

class Book(models.Model):
    publication = models.ForeignKey(Publication)
    pagination = models.PositiveSmallIntegerField(verbose_name="Number of pages in the book")

class PaperPage(AbstractDigitalPaperPage):
    original_file = models.FileField(upload_to="paper_page/%Y/%m/%d", max_length=255, verbose_name=u"PDF File")
    paper_channel = models.CharField(blank=True, max_length=255)
    page_number = models.PositiveSmallIntegerField()
    book = models.ForeignKey(Book)    

class Article(models.Model):
    pass
