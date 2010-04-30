var libePage = function(pageNumber, pageId) {
    var _pageNumber, _pageId, _imageSource, _pageElement, _areasElement = [], _lastObjectId;
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function handleMap(data) {
        if (!data.map[0].area) {
            return;
        }
        var map = data.map[0];
        
        var ratio = map["@width"] / map["@height"]
        jQuery(window).trigger('ratio-known', [ratio]);
        var reductionRatio = libeConfig.pageWidth / map["@width"];
        
        for (var i=0, il=map.area.length; i < il; i++) {
            var area = map.area[i];
            var coords = area["@coords"].split(",");
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
                var objectId = target.data('area')["@objectId"];
                _lastObjectId = objectId;
                jQuery('.area').trigger("highlight-area-" + objectId);
            }, function() {
                var target = jQuery(this);
                var objectId = target.data('area')["@objectId"];
                _lastObjectId = null;
                setTimeout(function () {
                    if (_lastObjectId == objectId) {
                        return;
                    }
                    jQuery('.area').trigger("unhighlight-area-" + objectId);
                }, 100);
            });
            
            areaElement.bind('highlight-area-' + area["@objectId"], highlightArea);
            areaElement.bind('unhighlight-area-' + area["@objectId"], unhighlightArea);
        }
    }
    
    function openArea() {
        var data = jQuery(this).data('area');
        if (data["@objectClass"] == "article") {
            window.open(data["@objectId"]);
        }
    }

    function highlightArea() {
        jQuery(this).animate({opacity: 0.3}, 300);
    }
    function unhighlightArea() {
        jQuery(this).animate({opacity: 0}, 300);
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
    
    var img = document.createElement("img");
    img.src = _imageSource = libeConfig.apiRoot + 'resources/page_preview_' + _pageId + '.jpg';
    _pageElement.appendChild(img);
    
    if (_pageNumber % 2 == 0) {
        libeConfig.evenSideElement.appendChild(_pageElement);
    } else {
        libeConfig.oddSideElement.appendChild(_pageElement);
    }
    
    var url = libeConfig.apiRoot + "resources/page_map_" + _pageId + ".json";
    jQuery.ajax({url: url, dataType: "json", success: handleMap, error: defaultAjaxError});

    return {
        show: show,
        hide: hide,
        imageSource: _imageSource,
        pageId: _pageId
    }
}