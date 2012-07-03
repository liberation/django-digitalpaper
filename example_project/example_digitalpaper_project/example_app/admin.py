from django.contrib import admin

from example_digitalpaper_project.example_app import models

admin.site.register(models.Publication)
admin.site.register(models.Book)
admin.site.register(models.PaperPage)
admin.site.register(models.Article)