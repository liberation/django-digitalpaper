var libePage = function(pageNumber, pageId) {
    var _pageNumber, _pageId, _pageElement, _areasElement = [], _lastObjectId;
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function handleMap(data) {
        if (!data.map[0].area) {
            return;
        }
        
        var ratio = libeConfig.pageWidth / data.map[0]["@width"];
        
        for (var i=0, il=data.map[0].area.length; i < il; i++) {
            var area = data.map[0].area[i];
            var coords = area["@coords"].split(",");
            var left = coords[0] * ratio;
            var top = coords[1] * ratio;
            var width = (coords[2] - coords[0]) * ratio;
            var height = (coords[3] - coords[1]) * ratio;
            
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
            areaElement.hover(hoverInArea, hoverOutArea);
        }
    }
    
    function openArea() {
        var data = jQuery(this).data('area');
        if (data["@objectClass"] == "article") {
            window.open(data["@objectId"]);
        }
    }

    function animateAreas(objectId, animation, duration) {
        for (var i = 0, il = _areasElement.length; i < il; i++) {
            if (_areasElement[i].data('area')["@objectId"] == objectId) {
                _areasElement[i].animate(animation, duration);
            }
        }
    }
    
    function hoverInArea() {
        var target = jQuery(this);
        var objectId = target.data('area')["@objectId"];
        _lastObjectId = objectId;
        animateAreas(objectId, {opacity: 0.3}, 300);
    }
    function hoverOutArea() {
        var target = jQuery(this);
        var objectId = target.data('area')["@objectId"];
        _lastObjectId = null;
        setTimeout(function () {
            // Don't animate if we come from the same article
            if (_lastObjectId == objectId) {
                return;
            }
            
            animateAreas(objectId, {opacity: 0}, 300);
        }, 50);
    }
    
    function show() {
        _pageElement.style.visibility = "visible";
    }
    
    function hide() {
        _pageElement.style.visibility = "hidden";
    }
    
    // Init Code
    
    _pageNumber = pageNumber;
    _pageId = pageId;
    
    _pageElement = document.createElement("div");
    _pageElement.className = "page";
    
    var img = document.createElement("img");
    img.src = libeConfig.apiRoot + 'page_preview_' + _pageId + '.jpg';
    _pageElement.appendChild(img);
    
    if (_pageNumber % 2 == 0) {
        libeConfig.evenSideElement.appendChild(_pageElement);
    } else {
        libeConfig.oddSideElement.appendChild(_pageElement);
    }
    
    var url = libeConfig.apiRoot + "page_map_" + _pageId + ".json";
    jQuery.ajax({url: url, dataType: "json", success: handleMap, error: defaultAjaxError});

    return {
        show: show,
        hide: hide,
    }
}