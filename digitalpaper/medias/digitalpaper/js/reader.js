var libeReader = function() {
    var _publicationId, _bookName, _publication, _selectedBook, _pages, _displayedPage, _displayedBook,
        _zoomWindow, _winHeight, _winWidth, _numberOfPages, _isZoomed, 
        _zoomedPageHeight, _zoomedPageWidth, _zoomMouseInit, _zoomPosInit, _zoomedPages, _zoomMouseDown,
        _step;
        
    _step = 21;
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function bindButtons() {
        jQuery('#previousButton, #previousCorner').click(showPreviousPage);
        jQuery('#nextButton, #nextCorner').click(showNextPage);
        jQuery('#firstButton').click(showFirstPage);
        jQuery('#lastButton').click(showLastPage);
        jQuery('#evenSide, #oddSide').dblclick(zoom);
    }
    
    function unbindButtons() {
        jQuery('#previousButton, #previousCorner').unbind("click", showPreviousPage);
        jQuery('#nextButton, #nextCorner').unbind("click", showNextPage);
        jQuery('#firstButton').unbind("click", showFirstPage);
        jQuery('#lastButton').unbind("click", showLastPage);
        jQuery('#evenSide, #oddSide').unbind("dblclick");
    }
    
    function bindKeyboard() {
        jQuery(window).bind('keydown', keyboardCallback);
    }
    
    function unbindKeyboard() {
        jQuery(window).unbind('keydown', keyboardCallback);
    }
    
    function zoom(event) {
        var offset = jQuery(this).offset()
        if (!offset) {
            offset = {'left': 0, 'top': 0};
        }
        var x = event.pageX - offset.left;
        var y = event.pageY - offset.top;
        
        var previousElement = jQuery(this).prev();
        if (previousElement) {
            x = x + previousElement.width();
        }
        zoomAtCoordinates(x, y);
    }
    
    function zoomAtCoordinates(x, y) {
        if (!libeConfig.canZoom() || _isZoomed) {
            return false;
        }

        var x = x * libeConfig.zoomFactor;
        var y = y * libeConfig.zoomFactor;

        _zoomedPageHeight = libeConfig.pageHeight * libeConfig.zoomFactor;
        _zoomedPageWidth = libeConfig.pageWidth * libeConfig.zoomFactor;
        
        jQuery('#pagesSlider').hide();
        jQuery('#bookSwitcher').hide();
        
        height = jQuery(window).height()
        jQuery(document.body).css({'overflow': 'hidden', 'height': height });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        _zoomWindow = jQuery(document.createElement('div'));
        _zoomWindow.attr('id', 'zoomWindow');

        zoomResize();
        
        _zoomedPages = jQuery(document.createElement('div'));
        _zoomedPages.attr('id', 'zoomedPages');
        
        _numberOfPages = 0;
        if (_pages[_displayedPage]) {
            var leftPage = jQuery(document.createElement('img'));
            leftPage.attr({'id': 'leftPageZoomed', 'src': _pages[_displayedPage].imageSource});
            _zoomedPages.append(leftPage);
            _numberOfPages++;
        }
        if (_pages[_displayedPage + 1]) {
            var rightPage = jQuery(document.createElement('img'));
            rightPage.attr({'id': 'rightPageZoomed', 'src': _pages[_displayedPage + 1].imageSource});
            _zoomedPages.append(rightPage);
            _numberOfPages++;
        }
        if (_numberOfPages == 1) {
            _zoomedPages.children().first().css('width', '100%');
        }
        
        var top = y - (_winHeight / 2);
        top = zoomTopInArea(top);
        
        if (_numberOfPages == 1 && x > _zoomedPageWidth) {
            x = x - _zoomedPageWidth;
        }
        var left = x - (_winWidth / 2);
        left = zoomLeftInArea(left);
        _zoomedPages.css({'height': _zoomedPageHeight, 'width': _numberOfPages * _zoomedPageWidth, 'top': -top, 'left': -left});
        
        _zoomWindow.append(_zoomedPages);
        _zoomWindow.dblclick(quitZoom);
        
        _zoomWindow.mousedown(zoomMouseDown);
        _zoomWindow.mouseup(zoomMouseUp);
        _zoomWindow.mousemove(zoomMouseMove);
        jQuery(document.body).mouseleave(zoomMouseUp);
        jQuery(document.body).bind('mousewheel', zoomMouseWheel);
        jQuery(window).bind('resize', zoomResize);
        
        jQuery(document.body).append(_zoomWindow);
        
        // Just for Apple touch, jQuery suxx and delete e.touches
        document.getElementById('zoomWindow').addEventListener('touchstart', zoomMouseDown, true);
        document.getElementById('zoomWindow').addEventListener('touchend', zoomMouseUp, true);
        document.getElementById('zoomWindow').addEventListener('touchmove', zoomMouseMove, true);
        
        zoomInitHDGrid(top, left);
        _isZoomed = true;
    }
    
    function zoomInitHDGrid(top, left) {
        _HDgridContainer = jQuery(document.createElement('div'));
        _HDgridContainer.css({'height': _zoomedPageHeight, 'width': _numberOfPages * _zoomedPageWidth, 'top': -top, 'left': -left});
        _HDgridContainer.attr('id', 'HDGrid');
        
        var nbZones = _numberOfPages * libeConfig.imagesPerRow * libeConfig.imagesPerColumn;
        var xRowSize = Math.floor(_zoomedPageWidth / libeConfig.imagesPerRow);
        var yColumnSize = Math.floor(_zoomedPageHeight / libeConfig.imagesPerColumn);
        
        for (var i = 0; i < nbZones; i++) {
            var img = jQuery(document.createElement('img'));
            img.addClass('grid');
            img.css({'height': yColumnSize, 'width': xRowSize});
            _HDgridContainer.append(img);
        }
        _zoomWindow.append(_HDgridContainer);
        
        zoomHighDefAtCoordinates(left, top);
    }
    
    function quitZoom() {
        jQuery(_zoomWindow).detach();
        jQuery(window).unbind('resize', zoomResize);
        jQuery(window).unbind('mousewheel');        
        jQuery('#pagesSlider').show();
        jQuery('#bookSwitcher').show();
        jQuery(document.body).css({'overflow': 'hidden', 'height': 'auto' });        
        _isZoomed = false;
        return false;
    }
    
    function zoomResize() {
        var win = jQuery(window);
        _winHeight = win.height();
        _winWidth = win.width();
    }
    
    function keyboardCallback(e) {
        if (_isZoomed) {
            return zoomedKeyboardCallback(e);
        } else {
            return normalKeyboardCallback(e);        
        }
    }
    
    function normalKeyboardCallback(e) {
        if (e.ctrlKey) {
            switch (e.keyCode) {
                case 109: // -
                case 40:  // bottom
                    e.preventDefault();
                    break;
                case 61:  // =
                case 107: // +
                case 38:  // up
                    zoom(e);
                    e.preventDefault();
                    break;
                case 35: // end
                    showLastPage(e);
                    break;
                case 36: // home
                    showFirstPage(e);
                    break;                
                case 37: // left
                    showPreviousPage(e);
                    break;
                case 39: // right
                    showNextPage(e);
                    break;
                default:
                    break;
            }
        }
    }
    
    function zoomedKeyboardCallback(e) {
        _zoomLoadPosInit();
        var x = 0;
        var y = 0;
        if (e.ctrlKey) {
            switch (e.keyCode) {
                case 27:  // esc
                case 109: // -
                case 40: // bottom
                    quitZoom();
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        } else {
            switch (e.keyCode) {
                 case 27:  // esc
                    quitZoom();
                    e.preventDefault();
                    break;
                case 37: // left
                    x = -_step;
                    break;
                case 38: // up
                    y = -_step;
                    break;
                case 39: // right
                    x = _step;
                    break;
                case 40: // bottom
                    y = _step;
                    break;
                default:
                    break;
            }
        }
        if (x || y) {
            zoomBy(x, y);
            e.preventDefault();
        }
    }
    
    function _zoomLoadPosInit() {
        _zoomPosInit = {x: -parseInt(_zoomedPages.css('left'), 10), y: -parseInt(_zoomedPages.css('top'), 10)}
    }
    
    function zoomMouseDown(e) {
        // iPhone/iPad
        if (e.touches) {
            e.preventDefault();
            e = e.touches[0];
        } else {
            e.preventDefault();
            if (e.button != 0) {
                return;
            }
        }

        _zoomMouseDown = true;
        _zoomLoadPosInit();
        _zoomMouseInit = {x: e.clientX, y: e.clientY};
        _zoomWindow.css('cursor', '-webkit-grabbing');
        _zoomWindow.css('cursor', '-moz-grabbing');
    }
    
    function zoomMouseUp(e) {
        _zoomMouseDown = false;
        _zoomWindow.css('cursor', '-webkit-grab');
        _zoomWindow.css('cursor', '-moz-grab');
        e.preventDefault();
        
        zoomHighDefAtCoordinates(-parseInt(_zoomedPages.css('left'), 10), -parseInt(_zoomedPages.css('top'), 10))
    }
    
    function zoomMouseMove(e) {
        if (_zoomMouseDown != true) {
            return;
        }
        
        // iPhone/iPad
        if (e.touches) {
            e.preventDefault();
            e = e.touches[0];
        } else {
            e.preventDefault();
        }

        zoomBy(_zoomMouseInit.x - e.clientX, _zoomMouseInit.y - e.clientY);
    }
    
    function zoomMouseWheel(e, delta) {
        _zoomLoadPosInit();
        if (delta < 0) {
            zoomBy(0, _step);
        } else {
            zoomBy(0, -_step);
        }
        e.preventDefault();
    }
    
    function zoomBy(x, y) {
        var newLeft = _zoomPosInit.x + (x);
        var newTop = _zoomPosInit.y + (y);
        
        newLeft = zoomLeftInArea(newLeft);
        newTop = zoomTopInArea(newTop);
        
        _zoomedPages.css({'left': -newLeft, 'top': -newTop});
        _HDgridContainer.css({'left': -newLeft, 'top': -newTop});
    }
    
    function zoomLeftInArea(left) {
        if (left < 0) {
            left = 0;
        }
        if (left > _numberOfPages * _zoomedPageWidth - _winWidth) {
            left = _numberOfPages * _zoomedPageWidth - _winWidth;
        }
        
        return left;
    }
    function zoomTopInArea(top) {
        if (top < 0) {
            top = 0;
        }
        if (top > _zoomedPageHeight - _winHeight)
        {
            top = _zoomedPageHeight - _winHeight;
        }
        return top;
    }
    
    function zoomHighDefAtCoordinates(x, y) {
        x = x + (_winWidth / 2);
        y = y + (_winHeight / 2);
        
        var xRowSize = _zoomedPageWidth / libeConfig.imagesPerRow;
        var yColumnSize = _zoomedPageHeight / libeConfig.imagesPerColumn;
            
        var xRow = Math.floor( x / xRowSize);
        var yColumn = Math.floor( y / yColumnSize);
        getZoomImage(xRow, yColumn);
        
        for (var i = 0; i < _numberOfPages * libeConfig.imagesPerRow + libeConfig.imagesPerColumn; i++) {
            for (var j = 0; j < i; j++) {
                var plop = i - j;
                getZoomImage(xRow - j, yColumn - plop);
                getZoomImage(xRow + j, yColumn + plop);
                getZoomImage(xRow - plop, yColumn + j);
                getZoomImage(xRow + plop, yColumn - j);
            }
        }
    }
    
    function getZoomImage(xRow, yColumn) {    
        if (xRow < 0 || yColumn < 0) {
            return;
        }
        
        if (yColumn >= libeConfig.imagesPerColumn) {
            return;
        }

        if (_displayedPage == 0) {
            // If _displayedPage is 0, it means we are displaying the first page,
            // which is alone on the *right* hand side.
            // Constraints need to change in that case, to allow the coordinates 
            // on the right (where the first page is) and disallow the ones on the left
            // (where there isn't any page)
            if (xRow >= 2 * libeConfig.imagesPerRow || xRow < libeConfig.imagesPerRow) {
                return;
            }
        } else {
            if (xRow >= _numberOfPages * libeConfig.imagesPerRow) {
                return;
            }
        }

        if (_displayedPage == 0) {
            // Another hack for the first page: there are only half the number of images,
            // the indexing need to be changed. (Note: we don't want to change xRow and yColumn
            // directly, the web services expect x to be > imagesPerRow on the right page, 
            // even if it's the first one!)
            var imgIndex = yColumn * libeConfig.imagesPerRow + xRow - libeConfig.imagesPerRow;
        } else {
            var imgIndex = yColumn * libeConfig.imagesPerRow * _numberOfPages + xRow;
        }
        
        var img = _HDgridContainer.children().eq(imgIndex);
        if (!img) {
            return;
        }
        
        if (img.attr('src')) {
            return;
        }
        
        //img.css({'background-color': "yellow", 'border': "1 px solid black"});
        var currentPage = _pages[_displayedPage + Math.floor(xRow / libeConfig.imagesPerRow)];
        if (!currentPage) {
            return;
        }
        
        if (currentPage.pageId <= 0) {
            img.css({'visibility' : 'hidden'});
        } else {
            var replaces = {
                '{emitter_format}' : 'png',
                '{id}' : currentPage.pageId,
                '{perrow}' : libeConfig.imagesPerRow,
                '{percol}' : libeConfig.imagesPerColumn,
                '{x}' : xRow,
                '{y}' : yColumn
            }
            
            var src = 'http://' + libeConfig.webservices.paper_page_crop;
            for (key in replaces) {
                src = src.replace(key, replaces[key]);
            }
            img.attr('src', src);
        }
    }
    
    function showHoverCorner() {
        jQuery(this).css('opacity', 1);
    }
    function hideHoverCorner() {
        jQuery(this).css('opacity', 0);
    }
    
    function displayPagination() {
        var previousButtons = jQuery('#previousCorner, #previousButton, #firstButton');
        if (_displayedPage -2 >= 0) {
            previousButtons.show();
        } else {
            previousButtons.hide();
        }
        
        var nextButtons = jQuery('#nextCorner, #nextButton, #lastButton');
        if (_displayedPage + 2 <= _selectedBook.total) {
            nextButtons.show();
        } else {
            nextButtons.hide();
        }
    }
    
    function showPage(number) {    
        var newDisplayedPage = number - number % 2;
        
        // Non-existant page, nothing to do
        if (!_pages[newDisplayedPage] && !_pages[newDisplayedPage + 1]) {
            return;
        }
        
        unbindButtons();
        unbindKeyboard();
        
        var evenSide = jQuery('#evenSide');
        var finalWidth = evenSide.width();
        var height = evenSide.parent().height();
        var position = evenSide.position();
        
        var leftPage = jQuery(document.createElement('div'));
        leftPage.addClass('leftPage');
        if (_pages[newDisplayedPage]) {
            leftPage.css('background-image', 'url(' + _pages[newDisplayedPage].imageSource + ')');
        }
        
        var rightPage = jQuery(document.createElement('div'));
        rightPage.addClass('rightPage');
        if (_pages[newDisplayedPage + 1]) {
            rightPage.css('background-image', 'url(' + _pages[newDisplayedPage + 1].imageSource + ')');
        }
        
        var transitionElement = jQuery(document.createElement('div'));
        transitionElement.addClass('transitionPage');
        transitionElement.css('height', height);
        if (_displayedPage > newDisplayedPage) {
            transitionElement.css('left', 0);
        } else {
            transitionElement.css('right', 0);
        }
        transitionElement.append(leftPage);
        transitionElement.append(rightPage);
        
        var transitionContainerElement = jQuery(document.createElement('div'));
        transitionContainerElement.addClass('transitionContainer');
        transitionContainerElement.css({'width': 2 * finalWidth, 'height': height,
            'left': position.left});
        transitionContainerElement.append(transitionElement);
        evenSide.parent().append(transitionContainerElement);
        
        transitionElement.animate({'width': 2 * finalWidth}, function() { cleanAfterShowPage(number); jQuery(this).parent().detach()});
    }
    
    function _hideOldPages() {
        if (typeof _displayedPage != "undefined") {
            if (_pages[_displayedPage]) {
                _pages[_displayedPage].hide();
            }
            if (_pages[_displayedPage + 1]) {
                _pages[_displayedPage + 1].hide();
            }
        }
    }
    
    function cleanAfterShowPage(number) {    
        _hideOldPages();

        var newDisplayedPage = number - number % 2;
        if (_pages[newDisplayedPage] || _pages[newDisplayedPage + 1]) {
            _displayedPage = newDisplayedPage;
            window.location.hash = "#" + _displayedBook + '_' + _displayedPage;
        }

        if (_pages[_displayedPage]) {
            _pages[_displayedPage].show();
        }
        if (_pages[_displayedPage + 1]) {
            _pages[_displayedPage + 1].show();
        }
        
        displayPagination();
        bindButtons();
        bindKeyboard();
    }
        
    function showSelectedPage(e) {
        e.preventDefault();
        var tmp = _parseHashtoGetParams(this.href.split('#')[1]);
        var newDisplayedBook = tmp[0];
        var newDisplayedPage = tmp[1] - tmp[1] % 2;
        
        if (newDisplayedBook != _displayedBook) {
            showBook(newDisplayedBook, newDisplayedPage);
        } else if (newDisplayedPage != _displayedPage) {        
            showPage(newDisplayedPage);
        }
    }
    
    function showPreviousPage(e) {
        e.preventDefault();
        showPage(_displayedPage - 2);
    }
    function showNextPage(e) {
        e.preventDefault();
        showPage(_displayedPage + 2);
    }
    
    function showFirstPage(e) {
        e.preventDefault();
        showPage(0);
    }
    function showLastPage(e) {
        e.preventDefault();
        showPage(_selectedBook.total);
    }
    
    function sizeKnown(e) {
        var sides = jQuery('#evenSide, #oddSide');
        sides.width(libeConfig.pageWidth);
        jQuery(window).unbind(e);
    }
    
    function _changeBook(newBook) {    
        if (newBook > _publication.books.length) {
            newBook = 0;
        }
        if (_displayedBook != newBook) {
            jQuery('#pagesList').empty()
            jQuery('#pagesList').css({'left' : 0 });
            iPosition = 0;
        }
        _selectedBook = _publication.books[newBook];
        _displayedBook = newBook;
    }
    
    function showBook(bookToShow, possiblePage) {
        
        _hideOldPages();
        _changeBook(bookToShow);
        
        var pageToShow = 0;
        if (possiblePage >= 0 && possiblePage <= _selectedBook.total) {
            pageToShow = possiblePage;
        }

        jQuery(window).bind('size-known', sizeKnown);
        
        _pages = new Array(parseInt(_selectedBook.total, 10));
        for (var i = 0, il = _selectedBook.pages.length; i < il ; i++) {
            var page = _selectedBook.pages[i];
            _pages[page.page_number] = libePage(page.page_number, page.id, page.maps);
        }
        for (var i = 1; i <= _selectedBook.total; i++) {
            if (!_pages[i]) {
                _pages[i] = libePage(i, -1, []);
            }
            var a = _pages[i].getThumbnailForList(_displayedBook);
            jQuery('#pagesList').append(a);
            a.bind('click', showSelectedPage);
        }
        cleanAfterShowPage(pageToShow);
    }
    
    function _parseHashtoGetParams(hash) {
        var bookToShow = parseInt(hash.split('_')[0])
        var possiblePage = parseInt(hash.split('_')[1])
        return [bookToShow, possiblePage]
    }
    
    function handlePublication(data) {
        /*
        *   data is the publication json
        */
        _publication = data;

        var tmp = [0, 0];
        if (location.hash != "") {
            tmp = _parseHashtoGetParams(location.hash.split('#')[1]);
        }
        
        showBook(tmp[0], tmp[1]);
        showBookList();
    }
    
    function init(publicationId) {
        _publicationId = publicationId;
                
        var url = 'http://' + libeConfig.webservices['publication_structure'].replace('{emitter_format}', 'json').replace('{id}', publicationId);
        jQuery.ajax({url: url, dataType: "json", success: handlePublication, error: defaultAjaxError});
        
        jQuery('#zoomButton').click(function () {zoomAtCoordinates(0, 0)});
        jQuery('#previousCorner, #nextCorner').hover(showHoverCorner, hideHoverCorner);
    }
    
    function showBookList() {
        var len = _publication.books.length;
        for (var i = 0; i < len; i++) {
            var page = _publication.books[i].pages[0];
            var obj;
            if (page.page_number > 1) {
                // First page should always be numbered 1, so
                // it means the first page of this book is in
                // construction
                obj = libePage(1, -1, []);
            } else {
                obj = libePage(page.page_number, page.id, page.maps);
            }
            
            var a = obj.getThumbnailForList(i);            
            jQuery('#bookSwitcher').append(a);
            a.bind('click', showSelectedPage);
        }
    }
    
    return {
        init: init,
        showPage: showPage,
        showPreviousPage: showPreviousPage,
        showNextPage: showNextPage,
        showSelectedPage: showSelectedPage,
        showBook: showBook
    }
}();
