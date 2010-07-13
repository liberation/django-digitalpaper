var libeConfigFunc = function (data) {
   
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    
    var canAccess = function(pageNumber, pageId) {
        return settings.pagesFree.indexOf(pageNumber) >= 0
    };
    
    var canZoom = function(pageNumber, pageId) {
        return canAccess(pageNumber, pageId)
    };
    
    this.settings = {
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
