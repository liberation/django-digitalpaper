var Page = function(reader, pageNumber, pageId, pageChannel, pageMaps) {
    var self = this;
    var _pageElement = [], _areasElement = [];
    var map = {};
    var _pageNumber = -1;
    var _mapsLoaded = false;
    var _smallImageSource = null, _smallestImageSource = null, _imageSource = null;
    var _pageChannel = "";

    function hoverArea() {
        var target = jQuery(this);
        var objectId = target.data('area').object_id;
        jQuery('.area').trigger("highlight-area-" + objectId);
    }
    
    function unhoverArea() {
        var target = jQuery(this);
        var objectId = target.data('area').object_id;
        jQuery('.area').trigger("unhighlight-area-" + objectId);    
    }

    function handleMap() {
        if (_mapsLoaded) {
            return;
        }
        if (!reader.pageWidth) {
            // too soon! better luck next time.
            return;
        }
        _mapsLoaded = true;
        if (!map || !map.areas || !map.areas.length || !map.width || !map.height) {
            return;
        }
        var reductionRatio = reader.pageWidth / map.width;
        for (var i = 0, il = map.areas.length; i < il; i++) {
            var area = map.areas[i];
            var coords = area.coords.split(",");
            var left = Math.ceil(coords[0] * reductionRatio);
            var top = Math.ceil(coords[1] * reductionRatio);
            var width = Math.ceil((coords[2] - coords[0]) * reductionRatio);
            var height = Math.ceil((coords[3] - coords[1]) * reductionRatio);
            
            var areaElement = document.createElement('a');
            areaElement.className = "area";
            areaElement.href = "#!/a" + area.object_id;
            areaElement.style.left = left + "px";
            areaElement.style.top = top + "px";
            areaElement.style.width = width + "px";
            areaElement.style.height = height + "px";
            
            areaElement = jQuery(areaElement);
            areaElement.click(openArea);
            _areasElement.push(areaElement);
            jQuery(_pageElement).append(areaElement);
            
            areaElement.data('area', area);
            areaElement.hover(hoverArea, unhoverArea);
            
            areaElement.bind('highlight-area-' + area.object_id, highlightArea);
            areaElement.bind('unhighlight-area-' + area.object_id, unhighlightArea);
        }
    }
    
    function openArea() {
        if (!reader.canUseMap(_pageNumber, this.pageId)) {
            reader.restrictedAccess();
            return false;
        }
        var data = jQuery(this).data('area');
        if (data.object_class == "article") {
            var url = reader.contentmodel;
            var replaces = {
                '{format}' : 'html',
                '{id}' : data.object_id,
                '{classname}' : 'article'
            };

            var k;
            for (k in replaces) {
                url = url.replace(k, replaces[k]);
            }
            
            k = 'default';
            if (typeof reader.modelmapping[data.object_class] !== 'undefined') {
                k = data.object_class;
            }

            if (reader.modelmapping[k] == 'iframe' ||
                reader.modelmapping[k] == 'ajax'   ||
                reader.modelmapping[k] == 'inline') {
                var dw = jQuery(this).openDOMWindow({
                    windowSourceURL: url,
                    windowSourceID: '#contentmodelContent',
                    width: parseInt(document.documentElement.clientWidth * 90 / 100, 10),
                    height: parseInt(document.documentElement.clientHeight * 90 / 100, 10),
                    fixedWindowY: 0,
                    windowSource: reader.modelmapping[k],
                    loader: 1,
                    functionCallOnClose: function() {
                        jQuery('body').css({'overflow': 'auto'});
                    },
                    functionCallOnOpen: function() {
                        jQuery('body').css({'overflow': 'hidden'});
                    }
                });
                if (reader.modelmapping[k] == 'inline') {
                    // inline is interesting to add custom content, but
                    // it doesn't load the URL, so we have to do it manually
                    // Note: have a .inner element inside your #contentmodelContent
                    // when you want to use this!
                    jQuery('#DOMWindow .inner').load(url);
                }
            } else {
                window.open(url);
            }
        }
        return false;
    }

    function highlightArea() {
        jQuery(this).clearQueue().animate({opacity: 0.1}, 250);
    }
    function unhighlightArea() {
        jQuery(this).clearQueue().animate({opacity: 0}, 250);
    }
        
    this.show = function() {
        jQuery(_pageElement).show();
    };
    
    this.hide = function() {
        jQuery(_pageElement).hide();
    };
    
    this.getPageInfo = function() {
        return '<span class="pageNumber">' + _pageNumber + '</span>' +
               '<span class="pageChannel">' + _pageChannel + '</span>';
    };
    
    this.canAccess = function() {
        return reader.canAccess(_pageNumber, this.pageId);
    };
    
    this.getThumbnailForList = function(book, size) {
        var src;
        if (typeof size == 'undefined' || size != 'smallest') {
            size = 'small';
            src = _smallImageSource;
        } else {
            src = _smallestImageSource;
        }
        var href = '#!/' + book + '_' + _pageNumber;
        var a = jQuery('<a class="loading ' + size + ' ' + (_pageNumber % 2 ? 'odd' : 'even') + '" href="' + href + '"></a>');
        var img = jQuery('<img src="' + src + '" />');
        img.bind('load', function(e) {
            jQuery(this).parent().removeClass('loading');
        });
        img.bind('error', function(e) {
            jQuery(this).parent().removeClass('loading');
            jQuery(this).parent().addClass('warning');            
        });
        a.append(img);
        a.append('<span class="pageNumber">' + _pageNumber + '</span>');
        return a;
    };
    
    // Init Code
    
    if (typeof(pageNumber) !== 'undefined') {
        _pageNumber = parseInt(pageNumber, 10);
    }

    if (typeof(pageId) !== 'undefined') {
        this.pageId = parseInt(pageId, 10);
    }
    
    if (typeof(pageChannel) !== 'undefined') {
        _pageChannel = pageChannel;
    }
    
    _pageElement = document.createElement("div");
    _pageElement.className = "page loading";
    jQuery(_pageElement).height(reader.pageHeight);  // page height is always fixed from config - width is dynamic
    if (this.pageId > 0) {
        _pageElement.id = 'page_' + this.pageId;
    }
    
    var baseSrc = "";
    // Set thumbnails, they are always visible, unless the page is under construction
    if (this.pageId > 0) {
        baseSrc = reader.paper_page_resized.replace('{format}', 'jpg').replace('{id}', this.pageId);
        _smallestImageSource = baseSrc.replace('{size}', 'x' + reader.pageSmallThumbnailHeight);
        _smallImageSource    = baseSrc.replace('{size}', 'x' + reader.pageThumbnailHeight);
    } else {
        _smallestImageSource = reader.pageUnderConstructionImageSmallest;
        _smallImageSource = reader.pageUnderConstructionImage;
    }

    var img;
    if (_pageNumber <= 0) {
        // non existant page, do nothing
    } else if (!this.canAccess()) {
        // page that the user isn't allowed to read
        img = document.createElement("img");
        img.src = _imageSource = reader.pageLimitedAccessImage;
        _pageElement.appendChild(img);
    } else if (this.pageId <= 0) {
        // page not yet included in the book, but that should exist: display it as "under construction"
        img = document.createElement("img");
        img.src = _imageSource = reader.pageUnderConstructionImage;
        _pageElement.appendChild(img);
    } else {
        // normal page
        map = pageMaps;
        img = document.createElement("img");
        jQuery(img).bind('load', function(e) {
            jQuery(_pageElement).removeClass('loading');
            // Little trick: use _pageElement and not the image to find out the dimensions of the 
            // content, since the load event might occur at a time the image is hidden (if the user
            // is flipping through pages very fast).
            if (reader.setSize(jQuery(_pageElement).width(), jQuery(_pageElement).height())) {
                // handleMap() would make more sense in showPage(), but we really need
                // to know the right width before calling it, so we call it here.
                handleMap();
            }
        });
        jQuery(img).bind('error', function(e) {
            jQuery(_pageElement).removeClass('loading');
            jQuery(_pageElement).addClass('warning');
        });
        img.src = _imageSource = baseSrc.replace('{size}', 'x' + reader.pageHeight);
        _pageElement.appendChild(img);
    }

    if (_pageNumber % 2 === 0) {
        reader.evenSideElement.append(_pageElement);
    } else {
        reader.oddSideElement.append(_pageElement);
    }
};
