var libeConfigFunc = function (data) {
   
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    var accessLevel = 0;
    
    var canAccess = function(pageNumber, pageId) {
        return settings.accessLevel > 0 || settings.pagesFree.indexOf(pageNumber) >= 0;
    };
    
    var canZoom = function() {
        return settings.accessLevel > 0;
    };
    
    var changeAccessLevel = function(newlevel) {
        settings.accessLevel = newlevel;
    };

    this.settings = {
        'accessLevel' : accessLevel,
        'changeAccessLevel' : changeAccessLevel,
        'canAccess': canAccess,
        'canZoom': canZoom,
        'evenSideElement' : evenSideElement,
        'oddSideElement' : oddSideElement,        
    };
    
    for (d in data) {
        if (typeof d == 'string') {
            this.settings[d] = data[d];
        }
    }    
    
    return this.settings;
}
