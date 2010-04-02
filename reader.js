var libeReader = function() {
    var _publicationId, _bookName, _publication, _selectedBook, _pages, _displayedPage,
        _pageHeight, _pageWidth,_ratio, _zoomWindow;
    var _zoomFactor = 4;
    
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
    
    function zoom(event) {
        var offset = jQuery(this).offset()
        var x = event.pageX - offset.left;
        var y = event.pageY - offset.top;
        
        var previousElement = jQuery(this).prev();
        if (previousElement) {
            x = x + previousElement.width();
        }
        zoomAtCoordinates(x, y);
    }
    
    function zoomAtCoordinates(x, y) {
        var x = x * _zoomFactor;
        var y = y * _zoomFactor;
        var zoomedPageHeight = _pageHeight * _zoomFactor;
        var zoomedPageWidth = _pageWidth * _zoomFactor;
        
        jQuery(document.body).css('overflow', 'hidden');
        
        _zoomWindow = jQuery(document.createElement('div'));
        _zoomWindow.attr('id', 'zoomWindow');

        var doc = jQuery(document);
        var docHeight = doc.height();
        var docWidth = doc.width();
        
        _zoomedPages = jQuery(document.createElement('div'));
        _zoomedPages.attr('id', 'zoomedPages');
        
        var numberOfPages = 0;
        if (_pages[_displayedPage]) {
            var leftPage = jQuery(document.createElement('img'));
            leftPage.attr({'id': 'leftPageZoomed', 'src': _pages[_displayedPage].imageSource});
            _zoomedPages.append(leftPage);
            numberOfPages++;
        }
        if (_pages[_displayedPage + 1]) {
            var rightPage = jQuery(document.createElement('img'));
            rightPage.attr({'id': 'rightPageZoomed', 'src': _pages[_displayedPage + 1].imageSource});
            _zoomedPages.append(rightPage);
            numberOfPages++;
        }
        if (numberOfPages == 1) {
            _zoomedPages.children().first().css('width', '100%');
        }
        
        var top = y - (docHeight / 2);
        if (top < 0) {
            top = 0;
        }
        if (top > zoomedPageHeight - docHeight)
        {
            top = zoomedPageHeight - docHeight;
        }
        
        if (numberOfPages == 1 && x > zoomedPageWidth) {
            x = x - zoomedPageWidth;
        }
        var left = x - (docWidth / 2);
        if (left < 0) {
            left = 0;
        }
        if (left > numberOfPages * zoomedPageWidth - docWidth) {
            left = numberOfPages * zoomedPageWidth - docWidth;
        }
        _zoomedPages.css({'height': zoomedPageHeight, 'width': numberOfPages * zoomedPageWidth, 'top': -top, 'left': -left});
        
        _zoomWindow.append(_zoomedPages);
        _zoomWindow.dblclick(quitZoom);
        
        jQuery(document.body).append(_zoomWindow);
    }
    
    function quitZoom() {
        jQuery(_zoomWindow).detach();
        jQuery(document.body).css('overflow', 'visible');
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
    
    function cleanAfterShowPage(number) {
        if (_displayedPage != "undefined") {
            if (_pages[_displayedPage]) {
                _pages[_displayedPage].hide();
            }
            if (_pages[_displayedPage + 1]) {
                _pages[_displayedPage + 1].hide();
            }
        }

        var newDisplayedPage = number - number % 2;
        if (_pages[newDisplayedPage] || _pages[newDisplayedPage + 1]) {
            _displayedPage = newDisplayedPage;
            window.location.hash = "#" + _displayedPage;
        }

        if (_pages[_displayedPage]) {
            _pages[_displayedPage].show();
        }
        if (_pages[_displayedPage + 1]) {
            _pages[_displayedPage + 1].show();
        }
        
        displayPagination();
        bindButtons();
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
    
    function ratioKnown(e, ratio) {
        var sides = jQuery('#evenSide, #oddSide');
        var height = sides.height();
        // If no image downloaded, leave and wait for the next event
        if (height < 100) {
            return;
        }

        _ratio = ratio;
        _pageHeight = height;
        _pageWidth = height * ratio;
        
        sides.width(_pageWidth);
        jQuery(window).unbind(e);
    }
    
    function handlePublication(data) {
        _publication = data.publication[0];
        
        _selectedBook = _publication.book[0];
        for (var i in _publication.book) {
            if (_publication.book[i].name == _bookName) {
                _selectedBook = _publication.book[i];
                break;
            }
        }
        
        // Hack to know the ratio of the pages for a publication
        jQuery(window).bind('ratio-known', ratioKnown);
        
        _pages = new Array(parseInt(_selectedBook.total, 10));
        for (var i = 0, il = _selectedBook.page.length; i < il ; i++) {
            var page = _selectedBook.page[i];
            _pages[page.pageNumber] = libePage(page.pageNumber, page.id);
        }
        
        var pageToShow = 0;
        if (location.hash != "") {
            var possiblePage = parseInt(location.hash.split('#')[1], 10);
            if (possiblePage >= 0 && possiblePage <= _selectedBook.total) {
                pageToShow = possiblePage;
            }
        }
        cleanAfterShowPage(pageToShow);
    }
    
    function init(publicationId, bookName) {
        _publicationId = publicationId;
        _bookName = bookName;
                
        var url = libeConfig.apiRoot + "publication_" + publicationId + ".json";
        jQuery.ajax({url: url, dataType: "json", success: handlePublication, error: defaultAjaxError});
        
        jQuery('#previousCorner, #nextCorner').hover(showHoverCorner, hideHoverCorner)
    }
    
    return {
        init: init,
        showPage: showPage,
        showPreviousPage: showPreviousPage,
        showNextPage: showNextPage
    }
}();
