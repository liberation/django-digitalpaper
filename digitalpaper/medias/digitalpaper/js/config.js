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
    }
    
    var changeAccessLevel = function(newlevel) {
        settings.accessLevel = newlevel;
    };
    
    var changeAuthStatus = function(newstatus) {
        settings.authenticated = newstatus;
    };
       
    var restrictedAccess = function() {
        jQuery.openDOMWindow({
            windowSourceID: '#restrictedAccess',
            width: 700,
            height: 450
        });
        return false;
    };

    var setSize = function(w, h) {
        // dynamic config should set height
        if (w) {
            libeConfig.pageWidth = w
            // libeConfig.pageHeight = h
            // libeConfig.pageThumbnailHeight = 
            libeConfig.pageThumbnailWidth = parseInt(w * libeConfig.pageThumbnailHeight / libeConfig.pageHeight, 10);
            jQuery(window).trigger('size-known');
            return true;
        }
        return false;
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
        'pageWidth': 0,
        'pageHeight': 0,
        'pageThumbnailWidth': 0,
        'pageThumbnailHeight': 0
    };
    
    // The remaining settings need to be set using the arguments (use config.js
    // as jsonp)
    for (d in data) {
        if (typeof d == 'string') {
            this.settings[d] = data[d];
        }
    }    
    
    return this.settings;
}
