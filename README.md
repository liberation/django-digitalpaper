Django Digitalpaper is a newspaper viewer in Django, JavaScript, CSS and HTML5.

It needs better documentation to explain how it works, what you need to get it
to run, etc. The few things you should know:

- Its goal is to emulate the look & feel of a newspaper on the web.
- Although it's not meant to, it can easily run without django. Simply 
  replace the views and template by your own. What's really important is giving
  it access to an API that follows the same principles the app is expecting.
- It should be compatible with all modern browsers, and some older ones (IE7).
- It was initially developped by and for Liberation.fr , and you can find it in
  production at http://journal.liberation.fr/publication/liberation/

The toplevel directory of the repository contains an example_project which 
implements the basic views you need to use the app. There is a preloaded 
sqlite db (*) in it containing basic data, as well as some medias, but you
can also use your own if you want.

(*) Should you want to log in, use demo/demo or change that user using a shell.

If you want to use the python code in utils.py (or the example_project, which
depends on it), you'll need to install the python requirements by doing 
pip install -r requirements.txt and have the following binaries in your PATH:
- convert (from imagemagick)
- gs (from ghostscript)

Basic usage
===========

Server side
-----------

You need at least an ajax view to return the publication object as json

Client side
-----------

You can build and initialize the reader like this :

```javascript
var reader = Reader({'publicationId':45});
```

Colorbox
--------

We are now using Colorbox as a popup manager, you can change its default 
behavior by doing something like this:

```javascript
var colorbox_defaults = {
    close: '',
    [insert any setting here]
};

$.extend($.colorbox.settings, colorbox_defaults);
```

Settings
--------

publicationId is the only mandatory setting, but you can override all of them:

```javascript
    var default_settings = {
        /********* mandatory settings (have to be overwriten) **********/
        'publicationId' : null,
        /********* end of mandatory settings *******/

        /********* urls **********/
        "pageLimitedAccessImage": '/static/digitalpaper/img/page-only-subscribers.png',
        "pageUnderConstructionImage": '/static/digitalpaper/img/page-under-construction.png',
        "pageUnderConstructionImageSmallest": '/static/digitalpaper/img/page-under-construction_smallest.png',
        "token": '/digitalpaper/token/',
        "publication": '/digitalpaper/publication/{id}/',
        "reader_by_date": '/digitalpaper/date/{date}/',
        "paper_page_resized": '/digitalpaper/page/{id}/',
        "paper_page_cropped": '/digitalpaper/page/{id}/',
        /****** end of urls ******/

        'accessLevelNeeded' : 1,
        'pageWidth': 354,
        'pageHeight': 500,
        'pageThumbnailWidth': 104,
        'pageThumbnailHeight': 148,
        'pagesFree': [1],
        'error_message': "Something terrible just happened.",
        'imagesPerRow': 4,
        'imagesPerColumn': 4,
        'zoomFactor': 4,
        'animationStep': 21,

        /********** markup ************/
        'evenSideElement': jQuery('#evenSide'),
        'oddSideElement': jQuery('#oddSide'),
        'restrictedAccessElement': jQuery('#restrictedAccess'),
        'previousButtonElement': jQuery('#previousButton'),
        'nextButtonElement': jQuery('#nextButton'),
        'firstButtonElement': jQuery('#firstButton'),
        'lastButtonElement': jQuery('#lastButton'),
        'previousCornerElement': jQuery('#previousCorner'),
        'nextCornerElement': jQuery('#nextCorner'),
        'previousButtonsParent': jQuery('#pagesBefore'),
        'nextButtonsParent': jQuery('#pagesAfter'),
        'zoomButtonElement': jQuery('#zoomButton'),
        'bookSwitcherElement': jQuery('#bookSwitcher'),
        'pagesSliderElement': jQuery('#pagesSlider'),
        'bookSwitcherElement': jQuery('#bookSwitcher'),
        'evenPageInfoElement': jQuery('#evenSide .pageInfo'),
        'oddPageInfoElement': jQuery('#oddSide .pageInfo'),
        'bookPagesElement': jQuery('#bookPages'),
        'contentmodelContentElement': jQuery('#contentmodelContent'),
        'pagesListElement': jQuery('#pagesList'),
        /******* end of markup ********/
    };
```

As a convenience, you can also override any public methods to change digitalpaper's behavior,
here is a full list:

* checkAccessLevel
  note : token_data is the data returned by the token view 

* canAccess(pageNumber, pageId)
* canZoom(pageNumber, pageId)
* canUseMap(pageNumber, pageId)



