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
Here is the most basic example of the response data (from the example project): 

```json
{
 "books": [
  {
   "pagination": 4,
   "pages": [
    {
     "maps": {},
     "page_number": 1,
     "id": 1,
     "paper_channel": ""
    },
    {
     "maps": {},
     "page_number": 2,
     "id": 2,
     "paper_channel": ""
    },
    {
     "maps": {},
     "page_number": 3,
     "id": 3,
     "paper_channel": ""
    },
    {
     "maps": {},
     "page_number": 4,
     "id": 4,
     "paper_channel": ""
    }
   ]
  }
 ]
}
```

And if you need to manage permissions, another ajax view to return the token datas. 
Here is a basic example, note that the whole object will be available in reader.token_data, 
so you can add anything like a boolean knowing if the user is authentified, and check for this value 
in the (overriden) checkAccessLevel method (which is called by default in every permission checking views). 

```json
{
 "access_level": false
}
```

Client side
-----------

You can build and initialize the reader like this : 

```javascript 
var reader = Reader({'publicationId':45});
```

Note : For now, it requires a specific markup to work properly, refer to [/digitalpaper/templates/digitalpaper/base.html](base.html)

Colorbox
--------

We are now using [Colorbox](http://www.jacklmoore.com/colorbox/) as a popup manager, you can change its default 
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
    };
```

As a convenience, you can also override any public methods to change digitalpaper's default behavior,
by defining them in the settings you pass when instantiating the reader, here is a full list:

* checkAccessLevel() 
* canAccess(pageNumber, pageId) 
* canZoom(pageNumber, pageId) 
* canUseMap(pageNumber, pageId) 
* restrictedAccess() 
* setSize() 
* defaultError(xhr, status) 

Some methods are public but it's not a good idea to override them 
(but you can call them if you need to hook the digitalpaper with other features): 
* bookDisplayed() 
* pageDisplayed() 
* showPreviousPage(e) 
* showNextPage(e) 
* showFirstPage(e) 
* showLastpage(e) 
* changeBook(book) 
* showBook(book, page) 
* zoom(e) 
* zoomAtCoordinates(x, y) 
* quitZoom() 

If you look at the source file you will notice a list of 'markup' elements in the settings, 
the goal was to be able to use digitalpaper on any html tree, but for now some functionalities are still heavily tied to the html structure. 
It will hopefully change in the future. 