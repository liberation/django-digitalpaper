var libeReader = function() {
    var _publicationId, _bookName, _publication, _selectedBook, _pages, 
        _displayedPage, _displayedBook, _zoomWindow, _winHeight, _winWidth, 
        _numberOfPages, _isZoomed, _zoomedPageHeight, _zoomedPageWidth, 
        _zoomMouseInit, _zoomPosInit, _zoomedPages, _zoomMouseDown, _step,
        _HDgridContainer;
        
    _step = 21;
    
    function bindButtons() {
        jQuery('#previousButton, #previousCorner').click(showPreviousPage);
        jQuery('#nextButton, #nextCorner').click(showNextPage);
        jQuery('#firstButton').click(showFirstPage);
        jQuery('#lastButton').click(showLastPage);
        jQuery('#evenSide, #oddSide').click(zoom);
    }
    
    function unbindButtons() {
        jQuery('#previousButton, #previousCorner').unbind("click", showPreviousPage);
        jQuery('#nextButton, #nextCorner').unbind("click", showNextPage);
        jQuery('#firstButton').unbind("click", showFirstPage);
        jQuery('#lastButton').unbind("click", showLastPage);
        jQuery('#evenSide, #oddSide').unbind("click");
    }
    
    function bindKeyboard() {
        jQuery(document).bind('keydown', keyboardCallback);
    }
    
    function unbindKeyboard() {
        jQuery(document).unbind('keydown', keyboardCallback);
    }
    
    function zoom(event) {
        var offset = jQuery(this).offset();
        if (!offset) {
            offset = {
                'left': 0, 
                'top': 0
            };
        }
        var x = event.pageX - offset.left;
        var y = event.pageY - offset.top;
        
        var previousElement = jQuery(this).prev();
        if (previousElement) {
            x = x + previousElement.width();
        }
        zoomAtCoordinates(x, y);
        return false;
    }
    
    function zoomAtCoordinates(x, y) {
        if (!libeConfig.canZoom()) {
            libeConfig.restrictedAccess();
            return false;
        }
        if (_isZoomed) {
            return false;
        }
        
        jQuery(document).trigger('page-beforezoom', [_displayedPage]);

        x = x * libeConfig.zoomFactor;
        y = y * libeConfig.zoomFactor;

        _zoomedPageHeight = libeConfig.pageHeight * libeConfig.zoomFactor;
        _zoomedPageWidth = libeConfig.pageWidth * libeConfig.zoomFactor;
        
        jQuery('#pagesSlider').hide();
        jQuery('#bookSwitcher').hide();
        
        var height = jQuery(window).height();
        jQuery(document.body).css({'overflow': 'hidden', 'height': height });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        _zoomWindow = jQuery(document.createElement('div'));
        _zoomWindow.attr('id', 'zoomWindow');
        _zoomWindow.addClass('grab');

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
        jQuery(document.body).addClass('zoomed');
        jQuery(window).bind('resize', zoomResize);
        
        jQuery(document.body).append(_zoomWindow);
        
        // Just for Apple touch, jQuery suxx and delete e.touches
        var zw = document.getElementById('zoomWindow');
        if (zw && zw.addEventListener) {
            zw.addEventListener('touchstart', zoomMouseDown, true);
            zw.addEventListener('touchend', zoomMouseUp, true);
            zw.addEventListener('touchmove', zoomMouseMove, true);
        }
        
        zoomInitHDGrid(top, left);
        _isZoomed = true;
        jQuery('#zoomButton').addClass('unzoom');
        jQuery(document).trigger('page-afterzoom', [_displayedPage]);
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
        jQuery(document).trigger('page-leavezoom', [_displayedPage]);
        jQuery(_zoomWindow).detach();
        jQuery(window).unbind('resize', zoomResize);
        jQuery(document.body).unbind('mousewheel');
        jQuery(document.body).removeClass('zoomed');        
        jQuery('#pagesSlider').show();
        jQuery('#bookSwitcher').show();
        jQuery(document.body).css({'overflow': 'visible', 'height': 'auto' });
        _isZoomed = false;
        jQuery('#zoomButton').removeClass('unzoom');
        return false;
    }
    
    function zoomResize() {
        var win = jQuery(window);
        _winHeight = win.height();
        _winWidth = win.width();
    }
    
    function keyboardCallback(e) {
        if (jQuery('#DOMWindow').length <= 0) {
            if (_isZoomed) {
                return zoomedKeyboardCallback(e);
            } else {
                return normalKeyboardCallback(e);        
            }
        }
    }
    
    function normalKeyboardCallback(e) {
        if (e.ctrlKey) {
            switch (e.which) {
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
            switch (e.which) {
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
            switch (e.which) {
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
        _zoomPosInit = {x: -parseInt(_zoomedPages.css('left'), 10), y: -parseInt(_zoomedPages.css('top'), 10)};
    }
    
    function zoomMouseDown(e) {    
        // iPhone/iPad
        if (e.touches) {
            e.preventDefault();
            e = e.touches[0];
        } else {
            e.preventDefault();
        }        

        _zoomMouseDown = true;
        _zoomLoadPosInit();
        _zoomMouseInit = {x: e.clientX, y: e.clientY};
        _zoomWindow.addClass('grabbing');
        _zoomWindow.removeClass('grab');        
    }
    
    function zoomMouseUp(e) {
        _zoomMouseDown = false;
        _zoomWindow.addClass('grab');
        _zoomWindow.removeClass('grabbing');
        e.preventDefault();
        
        zoomHighDefAtCoordinates(-parseInt(_zoomedPages.css('left'), 10), -parseInt(_zoomedPages.css('top'), 10));
    }
    
    function zoomMouseMove(e) {
        if (_zoomMouseDown !== true) {
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
    
    function zoomMouseWheel(e, deltaX, deltaY) {
        _zoomLoadPosInit();
        zoomBy(-_step * deltaX, -_step * deltaY);
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
            
        var xRow = Math.floor(x / xRowSize);
        var yColumn = Math.floor(y / yColumnSize);
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

        if (_displayedPage === 0) {
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

        var imgIndex = 0;
        if (_displayedPage === 0) {
            // Another hack for the first page: there are only half the number of images,
            // the indexing need to be changed. (Note: we don't want to change xRow and yColumn
            // directly, the web services expect x to be > imagesPerRow on the right page, 
            // even if it's the first one!)
            imgIndex = yColumn * libeConfig.imagesPerRow + xRow - libeConfig.imagesPerRow;
        } else {
            imgIndex = yColumn * libeConfig.imagesPerRow * _numberOfPages + xRow;
        }
        
        var img = _HDgridContainer.children().eq(imgIndex);
        if (!img) {
            return;
        }
        
        if (img.attr('src')) {
            return;
        }
        
        var currentPage = _pages[_displayedPage + Math.floor(xRow / libeConfig.imagesPerRow)];
        if (!currentPage) {
            return;
        }
        
        if (currentPage.pageId <= 0) {
            img.css({'visibility' : 'hidden'});
        } else {
            var replaces = {
                '{format}': 'png',
                '{id}': currentPage.pageId,
                '{crop}': libeConfig.imagesPerRow + 'x' + libeConfig.imagesPerColumn,
                '{x}': xRow,
                '{y}': yColumn
            };
            
            var src = libeConfig.webservices.paper_page_cropped;
            var k;
            for (k in replaces) {
                src = src.replace(k, replaces[k]);
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
        var previousButtons = jQuery('#previousCorner, #pagesBefore');
        if (_displayedPage - 2 >= 0) {
            previousButtons.show();
        } else {
            previousButtons.hide();
        }
        
        var nextButtons = jQuery('#nextCorner, #pagesAfter');
        if (_displayedPage + 2 <= _selectedBook.pagination) {
            nextButtons.show();
        } else {
            nextButtons.hide();
        }
        readerSlider.moveIntoView(_displayedPage);
    }
    
    function showPage(number) {
        var newDisplayedPage = number - number % 2;
        
        // Non-existant page, nothing to do
        if (!_pages[newDisplayedPage] && !_pages[newDisplayedPage + 1]) {
            return;
        }
        
        jQuery('#oddSide .pageInfo, #evenSide .pageInfo').fadeOut();
        
        unbindButtons();
        unbindKeyboard();
        
        var evenSide = jQuery('#evenSide');
        var oddSide =  jQuery('#oddSide');
        var finalWidth = evenSide.width();
        var height = evenSide.parent().height();
        var position = evenSide.position();
        
        var leftPage = jQuery(document.createElement('div'));
        leftPage.addClass('leftPage');
        if (_pages[newDisplayedPage]) {
            evenSide.css({'visibility' : 'visible'});
            leftPage.css('background-image', 'url(' + _pages[newDisplayedPage].imageSource + ')');
        } else {
            evenSide.css({'visibility' : 'hidden'});
        }

        var rightPage = jQuery(document.createElement('div'));
        rightPage.addClass('rightPage');
        if (_pages[newDisplayedPage + 1]) {
            oddSide.css({'visibility' : 'visible'});
            rightPage.css('background-image', 'url(' + _pages[newDisplayedPage + 1].imageSource + ')');
        } else {
            oddSide.css({'visibility' : 'hidden'});
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

        transitionElement.animate({'width': 2 * finalWidth}, {
                                   'step' : function _stepCallback(now,opts) {
                                        // Stop browser rounding errors
                                        now = opts.now = Math.round(now);
                                   }, 
                                   'complete' : function() { 
                                        cleanAfterShowPage(number); 
                                        jQuery(this).parent().detach();
                                   }
                                  });
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
        unHighlightCurrentPages();
    }
    
    function displayPage(number) {
        var page = _pages[number];
        page.show();
        highlightCurrentPages(_displayedBook, number);
        var elm = jQuery('#' + ((page.pageNumber % 2 === 0) ? 'even' : 'odd') + 'Side .pageInfo');
        elm.html(page.getPageInfo());
        elm.fadeIn();
    }
    
    function bookDisplayed() {
        return _displayedBook;
    }
    
    function pageDisplayed() {
        return _displayedPage;
    }
    
    function cleanAfterShowPage(number) {
        _hideOldPages();

        var newDisplayedPage = number - number % 2;
        if (_pages[newDisplayedPage] || _pages[newDisplayedPage + 1]) {
            _displayedPage = newDisplayedPage;
            window.location.hash = "#!/" + _displayedBook + '_' + _displayedPage;               
        }

        var showRestrictedAccess = false;
        var shownPages = [];
        if (_pages[_displayedPage]) {
            shownPages.push(_displayedPage);
            displayPage(_displayedPage);
            if (!_pages[newDisplayedPage].canAccess()) {
                showRestrictedAccess = true;
            }
        }
        if (_pages[_displayedPage + 1]) {
            shownPages.push(_displayedPage + 1);
            displayPage(_displayedPage + 1);
            if (!_pages[newDisplayedPage + 1].canAccess()) {
                showRestrictedAccess = true;
            }
        }
        
        if (showRestrictedAccess) {
            // show "access restricted" lightbox if the displayed page
            // is restricted - the user will be able to close it, 
            // it's just to remind him the page isn't free
            libeConfig.restrictedAccess();
        }        
        displayPagination();
        bindButtons();
        bindKeyboard();
        jQuery(document).trigger('pages-shown', [_displayedBook, shownPages]);
    }
        
    function showSelectedPage(e) {
        e.preventDefault();
        var tmp = _parseHashtoGetParams(this.href.split('#!/')[1]);
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
        showPage(_selectedBook.pagination);
    }
    
    function sizeKnown(e) {
        var sides = jQuery('#evenSide, #oddSide');
        sides.width(libeConfig.pageWidth);
        sides.css('max-height', libeConfig.pageHeight + 'px');
        var parent = sides.parent();
        if (parent) {
            parent.width(sides.outerWidth() * 2);
        }
        jQuery(window).unbind(e);
    }
    
    function unHighlightHoveredPages(e) {
        jQuery('#pagesList a.hovered').removeClass('hovered');
    }
    
    function unHighlightCurrentPages(e) {
        jQuery('#pagesList a.current').removeClass('current');
    }
    
    function highlightCurrentPages(book, page) {
        var current = jQuery('#thumb_' + book + '_' + page);
        current.addClass('current');        
    }
      
    function highlightHoveredPages(e) {
        // remove old highlight
        unHighlightHoveredPages();

        var hovered = jQuery(this);
        var neighbour = jQuery();
        
        // if it's an even page, find the one on the right if it exists
        if (hovered.hasClass('even')) {
            neighbour = hovered.next();
        }
        // if it's an odd page, find the one on the left if it exists
        if (hovered.hasClass('odd')) {
            neighbour = hovered.prev();
        }
        
        // highlight the relevant pages
        hovered.addClass('hovered');        
        neighbour.addClass('hovered');
    }
    
    function _changeBook(newBook) {
        if (newBook > _publication.books.length) {
            newBook = 0;
        }
        if (_displayedBook != newBook) {
            jQuery('#pagesList').empty();
            jQuery('#pagesList').css({'left' : 0 });
            jQuery('#bookSwitcher a').removeClass('selected');
            jQuery('#bookThumb-' + parseInt(newBook, 10)).addClass('selected');
        }
        _selectedBook = _publication.books[newBook];
        _displayedBook = newBook;
        
        if (typeof _selectedBook == 'undefined' || !_selectedBook.pagination) {
            libeConfig.defaultError({'status' : 418});
            return false;
        }
        return true;
    }
    
    function showBook(bookToShow, possiblePage) {

        _hideOldPages();
        if (!_changeBook(bookToShow)) {
            return false;
        }
        
        var pageToShow = 0;
        if (possiblePage >= 0 && possiblePage <= _selectedBook.pagination) {
            pageToShow = possiblePage;
        }

        jQuery(window).bind('size-known', sizeKnown);
        
        _pages = new Array(parseInt(_selectedBook.pagination, 10));
        var i;
        for (i = 0, il = _selectedBook.pages.length; i < il ; i++) {
            var page = _selectedBook.pages[i];
            _pages[page.page_number] = libePage(page.page_number, page.id, page.paper_channel, page.maps);
        }
        for (i = 1; i <= _selectedBook.pagination; i++) {
            if (!_pages[i]) {
                _pages[i] = libePage(i);
            }
            var a = _pages[i].getThumbnailForList(_displayedBook, 'smallest');
            a.attr({'id' : 'thumb_' + _displayedBook + '_' + i});
            jQuery('#pagesList').append(a);
            a.bind('click', showSelectedPage);
            a.bind('mouseover', highlightHoveredPages);
        }
        jQuery(document).trigger('book-load', [_selectedBook, _displayedBook]);
        showPage(pageToShow);
    }
    
    function findPageFromId(id) {
        var len = _publication.books.length;
        for (var i = 0; i < len; i++) {
            var book = _publication.books[i];
            var plen = book.pages.length;
            for (var j = 0; j < plen; j++) {
                var page = book.pages[j];
                if (page.id == id) {
                    return [i, page.page_number]; // don't trust j! book might be incomplete
                }
            }
        }
        return null;
    }
    
    function _parseHashtoGetParams(hash) {
        if (!hash) {
            return [0, 0];
        }
        if (hash[0] == 'p') {
            // if hash starts with "p", try to find a page with this id
            var result = findPageFromId(parseInt(hash.substr(1), 10));
            if (result) {
                return result;
            }
        }
        var bookToShow = parseInt(hash.split('_')[0], 10);
        var possiblePage = parseInt(hash.split('_')[1], 10);
        return [bookToShow, possiblePage];
    }
    
    function handlePublication(data) {
        _publication = data;
        
        // If the publication data contains an access level, use it as the new
        // access level needed.
        if (typeof data.access !== 'undefined') {
            libeConfig.changeAccessLevelNeeded(parseInt(data.access, 10));
        }
        
        jQuery('#pagesList').bind('mouseout', unHighlightHoveredPages);
        
        // Trigger a first event before showing any pages
        jQuery(document).trigger('publication-beforeload', [_publication, _publicationId]);
        
        var tmp = [0, 0];
        if (location.hash !== "") {
            tmp = _parseHashtoGetParams(location.hash.split('#!/')[1]);
        }
        
        showBookList(); // call first, so that we can play with the list in showBook()
        showBook((tmp[0] || 0), (tmp[1] || 0));
        
        jQuery(document).trigger('publication-load', [data, _publicationId]);
    }
    
    function init(publicationId) {
        _publicationId = publicationId;

        var url = libeConfig.webservices.publication.replace('{format}', 'json').replace('{id}', publicationId);

        jQuery.ajax({url: url, dataType: "json", success: handlePublication, error: libeConfig.defaultError});
        
        jQuery('#zoomButton').click(function (e) {
            if (_isZoomed) {
                quitZoom();
            } else {
                zoomAtCoordinates(0, 0);
            }
            return false;
        });
        jQuery('#previousCorner, #nextCorner').hover(showHoverCorner, hideHoverCorner);
    }
    
    function showBookList() {
        var len = _publication.books.length;
        for (var i = 0; i < len; i++) {
            var page = _publication.books[i].pages[0];
            var obj;
            if (typeof page == 'undefined' || !page || page.page_number > 1) {
                // First page should always be numbered 1. If it's non existant
                // or if it's not numbered 1, then the first page is still in
                // construction... Fake it.
                obj = libePage(1);
            } else {
                obj = libePage(page.page_number, page.id, page.paper_channel, page.maps);
            }
            
            var a = obj.getThumbnailForList(i);
            a.attr('id', "bookThumb-" + i);
            a.append('<span class="bookName">' + _publication.books[i].name + '</span>');
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
        showBook: showBook,
        bookDisplayed : bookDisplayed,
        pageDisplayed: pageDisplayed
    };
}();
