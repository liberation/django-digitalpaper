var accessLevels = {
    'BAS' : 0,
    'ESS' : 10,
    'PRE' : 20
}; // FIXME: those level names shouldn't exist, shouldn't be hardcoded in the app

var contentmapping = {
    'default' : 'iframe',
    'paperad' : 'link'
};

/* all configs 
 ************ inline globals ***********
 var publicationId = 1;
 var startDate = '2012/07/03';
 var lastDate  = '2012/07/03';
 var firstDate = '2012/07/03';


 ************ config.js ***********
 this.settings = {
 'authenticated' : authenticated,
 'accessLevel' : accessLevel,
 'accessLevelNeeded' : accessLevelNeeded,
 'changeAccessLevelNeeded' : changeAccessLevelNeeded,
 'changeAccessLevel' : changeAccessLevel,
 'changeAuthStatus' : changeAuthStatus,
 'canAccess': canAccess,
 'canZoom': canZoom,
 'canUseMap': canUseMap,
 'restrictedAccess' : restrictedAccess,
 'setSize' : setSize,
 'evenSideElement' : evenSideElement,
 'oddSideElement' : oddSideElement, 
 'defaultError' : defaultError,
 'pageWidth': 0,
 'pageHeight': 0,
 'pageThumbnailWidth': 0,
 'pageThumbnailHeight': 0,
 'pagesFree': [],
 'modelmapping': {
 'default': 'iframe'
 }

 ************ views reader_settings (Python) ***********
 data = {
        "pageThumbnailHeight": constants.PAPERPAGE_IMAGE_SMALL_HEIGHT,
        "pageSmallThumbnailHeight": constants.PAPERPAGE_IMAGE_EXTRASMALL_HEIGHT,
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
            "publication": get_uri_template("reader_publication"),
            "reader_by_date": get_uri_template("digitalpaper_reader_date"),
            "paper_page_resized": get_uri_template("reader_page_resized"),
             "paper_page_cropped": "",  # FIXME
            "contentmodel": "",  # FIXME
 }


************ Goals ***************
* unify how settings are passed (3 distincts source for now), Page and Config vars should not be global, end up with something like : var reader = Reader({config})
* get rid of jdpicker (let the user choose what date picker to use using reader.webservices.reader_by_date(date))
* default settings values, docs for each setting
* get rid of hardcoded accessLevels, there is no need for the reader to be aware of them, only the checking method (passed in the settings)
* get rid of this file.

*/


jQuery(document).ready(function () {

    




});
