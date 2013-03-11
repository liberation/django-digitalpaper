var libeConfigFunc = function (data) {
   
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    var accessLevel = 0;
    var accessLevelNeeded = 20;    
    var authenticated = false;
    
    var canAccess = function(pageNumber, pageId) {
        return settings.accessLevel >= settings.accessLevelNeeded || jQuery.inArray(pageNumber, settings.pagesFree) >= 0;
    };
    
    var canZoom = function() {
        return settings.accessLevel >= settings.accessLevelNeeded && settings.pageWidth && settings.pageHeight;
    };
    
    var canUseMap = function(pageNumber, pageId) {
        return settings.accessLevel >= settings.accessLevelNeeded && settings.pageWidth && settings.pageHeight;
    };
    
    var changeAccessLevelNeeded = function(newneededlevel) {
        settings.accessLevelNeeded = newneededlevel;
    };
    
    var changeAccessLevel = function(newlevel) {
        settings.accessLevel = newlevel;
    };
    
    var changeAuthStatus = function(newstatus) {
        settings.authenticated = newstatus;
    };
       
    var restrictedAccess = function() {
        jQuery(document).trigger('show-restricted-access');
        jQuery.colorbox({
            inline:true,
            href:'#restrictedAccess',
            width: 760,
            height: 480,
            onOpen:function() {
                jQuery('div#restrictedAccess').show();
            },
            onClosed:function() {
                jQuery('div#restrictedAccess').hide();
            }
        });
        return false;
    };

    var setSize = function(w, h) {
        // dynamic config should set height
        if (w) {
            libeConfig.pageWidth = w;
            // libeConfig.pageHeight = h
            // libeConfig.pageThumbnailHeight = 
            libeConfig.pageThumbnailWidth = parseInt(w * libeConfig.pageThumbnailHeight / libeConfig.pageHeight, 10);
            jQuery(window).trigger('size-known');
            return true;
        }
        return false;
    };

    var defaultError = function(xhr, status) {
        if (jQuery('#errorPopin').length <= 0) {
            jQuery('#main').append('<div id="errorPopin"></div>');
        }
        jQuery('#errorPopin').text(libeConfig.error_message + ' (Err. ' + xhr.status + ')');
        jQuery('#bookPages, #pagesBefore, #pagesAfter, #pagesSlider').hide();
        jQuery('#errorPopin').show();
    };

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
    };
    
    // The remaining settings need to be set using the arguments (use config.js
    // as jsonp)
    var d;
    for (d in data) {
        if (typeof d == 'string') {
            this.settings[d] = data[d];
        }
    }    
    return this.settings;
};
