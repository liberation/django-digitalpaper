var libeReader = function() {
    var _publicationId, _bookName, _publication, _selectedBook, _pages, _displayedPage;
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
    }
    
    function showHoverCorner() {
        jQuery(this).css('opacity', 1);
    }
    function hideHoverCorner() {
        jQuery(this).css('opacity', 0);
    }
    
    function displayCorners() {
        var previousCorner = jQuery('#previousCorner');
        if (_displayedPage -2 >= 0) {
            previousCorner.show();
        } else {
            previousCorner.hide();
        }
        
        var nextCorner = jQuery('#nextCorner');
        if (_displayedPage + 2 <= _selectedBook.total) {
            nextCorner.show();
        } else {
            nextCorner.hide();
        }
    }
    
    function showPage(number) {

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
        
        displayCorners();
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
    
    function handlePublication(data) {
        _publication = data.publication[0];
        
        _selectedBook = _publication.book[0];
        for (var i in _publication.book) {
            if (_publication.book[i].name == _bookName) {
                _selectedBook = _publication.book[i];
                break;
            }
        }
        
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
        showPage(pageToShow);
    }
    
    function init(publicationId, bookName) {
        _publicationId = publicationId;
        _bookName = bookName;
                
        var url = libeConfig.apiRoot + "publication_" + publicationId + ".json";
        jQuery.ajax({url: url, dataType: "json", success: handlePublication, error: defaultAjaxError});
        
        jQuery('#previousButton, #previousCorner').click(showPreviousPage);
        jQuery('#nextButton, #nextCorner').click(showNextPage);
        jQuery('#previousCorner, #nextCorner').hover(showHoverCorner, hideHoverCorner)
        jQuery('#firstButton').click(showFirstPage);
        jQuery('#lastButton').click(showLastPage);
    }
    
    return {
        init: init,
        showPage: showPage,
        showPreviousPage: showPreviousPage,
        showNextPage: showNextPage
    }
}();
