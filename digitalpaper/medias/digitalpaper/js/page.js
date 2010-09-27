var libePage = function(pageNumber, pageId, pageChannel, pageMaps) {
    var _pageElement, _areasElement = [];
    var map = {};
    var _pageNumber, _pageId = -1;
    var _mapsLoaded = false;
    var _smallImageSource, _imageSource = null;
    var _pageChannel = "";
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function handleMap() {
        if (_mapsLoaded) {
            return;
        }
        if (!libeConfig.pageWidth) {
            // too soon! better luck next time.
            return;
        }
        _mapsLoaded = true;
        if (!map || !map.areas || !map.areas.length || !map.width || !map.height) {
            return;
        }
        var reductionRatio = libeConfig.pageWidth / map.width;
        for (var i = 0, il = map.areas.length; i < il; i++) {
            var area = map.areas[i];
            var coords = area.coords.split(",");
            var left = Math.ceil(coords[0] * reductionRatio);
            var top = Math.ceil(coords[1] * reductionRatio);
            var width = Math.ceil( (coords[2] - coords[0]) * reductionRatio );
            var height = Math.ceil( (coords[3] - coords[1]) * reductionRatio );
            
            var areaElement = document.createElement('a');
            areaElement.className = "area";
            areaElement.href = "#";
            areaElement.style.left = left + "px";
            areaElement.style.top = top + "px";
            areaElement.style.width = width + "px";
            areaElement.style.height = height + "px";
            
            areaElement = jQuery(areaElement);
            areaElement.click(openArea);
            _areasElement.push(areaElement);
            jQuery(_pageElement).append(areaElement);
            
            areaElement.data('area', area);
            areaElement.hover(function() {
                var target = jQuery(this);
                var objectId = target.data('area').object_id;
                jQuery('.area').trigger("highlight-area-" + objectId);
            }, function() {
                var target = jQuery(this);
                var objectId = target.data('area').object_id;
                jQuery('.area').trigger("unhighlight-area-" + objectId);
            });
            
            areaElement.bind('highlight-area-' + area.object_id, highlightArea);
            areaElement.bind('unhighlight-area-' + area.object_id, unhighlightArea);
        }
    }
    
    function openArea() {
        var data = jQuery(this).data('area');
        if (data.object_class == "article") {
            var url = "http://" + libeConfig.webservices.contentmodel_content
            var replaces = {
                '{emitter_format}' : 'html',
                '{id}' : data.object_id,
                '{type}' : 'article',
            }

            for (key in replaces) {
                url = url.replace(key, replaces[key]);
            }
            
            var key = 'default'
            if (typeof libeConfig.modelmapping[data.object_class] !== 'undefined') {
                key = data.object_class
            }

            if (libeConfig.modelmapping[key] == 'iframe') {
                jQuery(this).openDOMWindow({
                    windowSourceURL: url,
                    windowSourceID: 'reader_contentmodel_content', 
                    height:400, 
                    width:700, 
                    positionType:'absolute', 
                    positionTop:50, 
                    positionLeft:50, 
                    windowSource:'iframe', 
                    loader:1, 
                });
            } else {
                window.open(url); // FIXME
            }
        }
    }

    function highlightArea() {
        jQuery(this).clearQueue().animate({opacity: 0.1}, 300);
    }
    function unhighlightArea() {
        jQuery(this).clearQueue().animate({opacity: 0}, 300);
    }
        
    function show() {
        jQuery(_pageElement).show();
    }
    
    function hide() {
        jQuery(_pageElement).hide();
    }
    
    function getThumbnailForList(book) {
        var a = jQuery('<a class="loading ' + (_pageNumber % 2 ? 'odd' : 'even') + '" href="#' + book + '_' + _pageNumber + '"></a>');
        var img = jQuery('<img src="' + _smallImageSource + '" />');
        img.bind('load', function(e) {
            jQuery(this).parent().removeClass('loading');
        });
        a.append('<span class="page_infos"><span class="page_number">' + _pageNumber + '</span>' + 
                 '<span class="page_channel">' + _pageChannel + '</span></span>')
        a.append(img);
        return a;
    }
    
    // Init Code
    
    _pageNumber = pageNumber;

    if (typeof(pageId) !== 'undefined') {
        _pageId = pageId;
    }
    if (typeof(pageChannel) !== 'undefined') {
        _pageChannel = pageChannel;
    }
    
    _pageElement = document.createElement("div");
    _pageElement.className = "page";
    
    if (_pageNumber <= 0) {
        // non existant page, do nothing
    } else if (!libeConfig.canAccess(_pageNumber, _pageId)) {
        // page that the user isn't allowed to read
        var img = document.createElement("img");
        img.src = _imageSource = _smallImageSource = libeConfig.pageLimitedAccessImage;
        _pageElement.appendChild(img);        
    } else if (_pageId < 0) {
        // page not yet included in the book, but that should exist: display it as "in construction"
        var img = document.createElement("img");
        img.src = _imageSource = _smallImageSource = libeConfig.pageInConstructionImage;
        _pageElement.appendChild(img);
    } else {
        // normal page
        map = pageMaps;
        var img = document.createElement("img");
        var tmp = libeConfig.webservices.paper_page.replace('{emitter_format}', 'jpg').replace('{id}', _pageId)
        jQuery(img).bind('load', function(e) {
            // Little trick: use _pageElement and not the image to find out the dimensions of the 
            // content, since the load event might occur at a time the image is hidden (if the user
            // is flipping through pages very fast).
            // In addition, 
            if (libeConfig.setSize(jQuery(_pageElement).width(), jQuery(_pageElement).height())) {
                // handleMap() would make more sense in showPage(), but we really need
                // to know the right width before calling it, so we call it here.
                handleMap();
            }
        });
        img.src = _imageSource = 'http://' + tmp.replace('{size}', 'x500');
        _smallImageSource = 'http://' + tmp.replace('{size}', 'x148');
        _pageElement.appendChild(img);
        
    }
    
    if (_pageNumber % 2 == 0) {
        libeConfig.evenSideElement.appendChild(_pageElement);
    } else {
        libeConfig.oddSideElement.appendChild(_pageElement);
    }
    
    return {
        show: show,
        hide: hide,
        imageSource: _imageSource,
        smallImageSource: _smallImageSource,
        pageId: _pageId,
        handleMap: handleMap,
        getThumbnailForList: getThumbnailForList
    }
}
