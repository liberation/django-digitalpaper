var libeReader = function() {
    var _publicationId, _bookName, _publication, _selectedBook, _pages, _displayedPage;
    
    function defaultAjaxError(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest, textStatus, errorThrown);
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
    }
    
    function showPreviousPage(e) {
        e.preventDefault();
        showPage(_displayedPage - 2);
    }

    function showNextPage(e) {
        e.preventDefault();
        showPage(_displayedPage + 2);
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
        
        var _pagesToFetch = [];
        for (var i in _selectedBook.page) {
            var page = _selectedBook.page[i];
            _pagesToFetch[page.pageNumber] = page.id;
        }
        
        var firstPageDone = false;
        _pages = [];
        // Pour être sur de charger les pages dans l'ordre numérique.
        for(var i = 0, il = _pagesToFetch.length; i < il; i++) {
            if (!_pagesToFetch[i]) {
                continue;
            }
            
            _pages[i] = libePage(i, _pagesToFetch[i]);
            
            if (!firstPageDone) {
                showPage(i);
                firstPageDone = true;
            }
        }
        
    }
    
    function init(publicationId, bookName) {
        _publicationId = publicationId;
        _bookName = bookName;
                
        var url = libeConfig.apiRoot + "publication_" + publicationId + ".json";
        jQuery.ajax({url: url, dataType: "json", success: handlePublication, error: defaultAjaxError});
        
        jQuery('#previousButton').click(showPreviousPage);
        jQuery('#nextButton').click(showNextPage);
    }
    
    return {
        init: init,
        showPage: showPage,
        showPreviousPage: showPreviousPage,
        showNextPage: showNextPage
    }
}();
