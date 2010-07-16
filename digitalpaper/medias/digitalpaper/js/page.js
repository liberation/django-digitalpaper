var libePage = function(pageNumber, pageId, pageMaps) {
    var _pageNumber, _pageId, _imageSource, _pageElement, _areasElement = [];
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function handleMap(data) {
        if (!data.areas) {
            return;
        }
        var map = data;
        
        var ratio = map.width / map.height
        jQuery(window).trigger('ratio-known', [ratio]);
        var reductionRatio = libeConfig.pageWidth / map.width;
        
        for (var i=0, il=map.areas.length; i < il; i++) {
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
        jQuery(this).clearQueue().animate({opacity: 0.3}, 300);
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
    
    // Init Code
    
    _pageNumber = pageNumber;
    _pageId = pageId;
    
    _pageElement = document.createElement("div");
    _pageElement.className = "page";
    
    if (_pageId < 0) {
        // page not yet included in the book, but that should exist: display it as "in construction"
        var img = document.createElement("img");
        img.src = _imageSource = libeConfig.pageInConstructionImage;
        _pageElement.appendChild(img);
    } else if (!libeConfig.canAccess(_pageNumber, _pageId)) {
        // page that the user isn't allowed to read
        var img = document.createElement("img");
        img.src = _imageSource = libeConfig.pageLimitedAccessImage;
        _pageElement.appendChild(img);
    } else {
        // normal page    
        var img = document.createElement("img");
        img.src = _imageSource = 'http://' + libeConfig.webservices.paper_page.replace('{emitter_format}', 'jpg').replace('{id}', _pageId).replace('{size}', 'x500');
        handleMap(pageMaps);
        _pageElement.appendChild(img);
    }
    
    if (_pageNumber % 2 == 0) {
        libeConfig.evenSideElement.appendChild(_pageElement);
    } else {
        libeConfig.oddSideElement.appendChild(_pageElement);
    }
    
    //var url = libeConfig.apiRoot + "resources/page_map_" + _pageId + ".json";
    //jQuery.ajax({url: url, dataType: "json", success: handleMap, error: defaultAjaxError});
    
    return {
        show: show,
        hide: hide,
        imageSource: _imageSource,
        pageId: _pageId
    }
}
