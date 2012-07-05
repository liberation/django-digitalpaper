from django.core.serializers.json import DateTimeAwareJSONEncoder
from django.conf import settings
from django.utils import simplejson as json
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.core.urlresolvers import reverse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from digitalpaper import constants
from digitalpaper.utils import (get_model_for_paperpage, 
                                get_model_for_publication, 
                                get_manager_for_publication,
                                get_uri_template,
                                PaperPageThumbnail, HttpResponseXFile)

def reader_settings(request, *args, **kwargs):
    data = {
        "pageThumbnailHeight": constants.PAPERPAGE_IMAGE_SMALL_HEIGHT, 
        "error_message": "Oops !", 
        "pageHeight": constants.PAPERPAGE_IMAGE_PREVIEW_HEIGHT, 
        "imagesPerRow": constants.PAPERPAGE_CROP_IMAGES_PER_ROW, 
        "imagesPerColumn": constants.PAPERPAGE_CROP_IMAGES_PER_COLUMN,
        "zoomFactor": constants.PAPERPAGE_CROPPED_ZOOM_FACTOR, 
        "pageLimitedAccessImage": "%sdigitalpaper/img/page-only-subscribers.png" % (settings.STATIC_URL), 
        "pageUnderConstructionImage": "%sdigitalpaper/img/page-under-construction.png" % (settings.STATIC_URL), 
        "pageUnderConstructionImageSmallest": "%sdigitalpaper/img/page-under-construction_smallest.png" % (settings.STATIC_URL), 
        "webservices": {
            "token": reverse("reader_token"),
            "publication_structure": get_uri_template("reader_publication"),
            "reader_by_date": get_uri_template("digitalpaper_reader_date"),
            "paper_page_resized": get_uri_template("reader_page_resized"),
            "paper_page_cropped": "", # FIXME
            "contentmodel_content": "", # FIXME
        }
    }
    result = json.dumps(data, cls=DateTimeAwareJSONEncoder, indent=1)
    return HttpResponse("%s(%s)" % (request.GET['jsonp'], result), mimetype='text/javascript')

def reader_page_resized(request, *args, **kwargs):
    # FIXME handle different formats, size, cropping.
    paperpage_model = get_model_for_paperpage()
    page = get_object_or_404(paperpage_model, pk=int(kwargs['id']))
    rval, detail = PaperPageThumbnail(page).generate_thumbnail(request.GET.get('size', 'x500'))
        
    if rval == PaperPageThumbnail.P_ERROR_BAD: # Something is wrong with the arguments
        return HttpResponseBadRequest(str(detail))
    elif rval == PaperPageThumbnail.P_ERROR_OS: # Something is wrong with the command used to generate the thumbnail. Bad file maybe ?
        return HttpResponseServerError(str(detail))
    else:
        filename = detail
        
    # Return the file
    return HttpResponseXFile(filename)


@csrf_exempt # FIXME ! shouldn't be necessary
def reader_token(request, *args, **kwargs):
    level = "PRE" if request.user.is_authenticated() else "BAS" # FIXME: those level names shouldn't exist, shouldn't be hardcoded in the app
    data = {
        "access_level": level,
    }
    result = json.dumps(data, cls=DateTimeAwareJSONEncoder, indent=1)
    return HttpResponse(result, mimetype='text/javascript')

def reader_publication(request, *args, **kwargs):
    publication_model = get_model_for_publication()
    manager = get_manager_for_publication(publication_model)
    pub = get_object_or_404(manager, pk=int(kwargs['id']))
    data = {
        'books': []
    }
    for book in pub.book_set.all():
        bookdata = {
            "pagination": book.pagination,
            "pages": [],
        }
        for page in book.paperpage_set.all():
            pagedata = {
                'maps': {}, # FIXME
                'page_number': page.page_number, 
                'id': page.pk,
                'paper_channel': page.paper_channel,
            }
            bookdata['pages'].append(pagedata)
        data['books'].append(bookdata)
    result = json.dumps(data, cls=DateTimeAwareJSONEncoder, indent=1)
    return HttpResponse(result, mimetype='text/javascript')