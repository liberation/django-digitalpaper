function Reader(settings) {
    var self = this;
    /********************* DEFAULT settings **********************/
    this.default_settings = {
        /********* mandatory settings (have to be overwriten) **********/
        'publicationId' : null,
        /********* end of mandatory settings *******/

        /********* api **********/
        "pageLimitedAccessImage": '/static/digitalpaper/img/page-only-subscribers.png',
        "pageUnderConstructionImage": '/static/digitalpaper/img/page-under-construction.png',
        "pageUnderConstructionImageSmallest": '/static/digitalpaper/img/page-under-construction_smallest.png',
        "token": '/digitalpaper/token/',
        "publication": '/digitalpaper/publication/{id}/',
        "reader_by_date": '/digitalpaper/date/{date}/',
        "paper_page_resized": '/digitalpaper/page/{id}/',
        "paper_page_cropped": '/digitalpaper/page/{id}/',
        /****** end of api ******/

        'accessLevel' : 0,
        'accessLevelNeeded' : 1,
        'pageWidth': 354,
        'pageHeight': 500,
        'pageThumbnailWidth': 104,
        'pageThumbnailHeight': 148,
        'pagesFree': [1],
        'error_message': "Something terrible just happened.",
        "imagesPerRow": 4,
        "imagesPerColumn": 4,
        "zoomFactor": 4,
        'canAccess': function(pageNumber, pageId) {
            return this.accessLevel >= this.accessLevelNeeded || jQuery.inArray(pageNumber, this.pagesFree) >= 0;
        },
        'canZoom': function(pageNumber, pageId) {
            return this.accessLevel >= this.accessLevelNeeded && this.pageWidth && this.pageHeight;
        },
        'canUseMap': function(pageNumber, pageId) {
            return this.accessLevel >= this.accessLevelNeeded && this.pageWidth && this.pageHeight;
        },
        'restrictedAccess' : function() {
            jQuery.openDOMWindow({
                windowSourceID: '#restrictedAccess',
                width: 760,
                height: 480,
                windowPadding: 0
            });
        },
        'setSize' : function(w, h) {
            if (w) {
                this.pageWidth = w;
                this.pageThumbnailWidth = parseInt(w * this.pageThumbnailHeight / this.pageHeight, 10);
                jQuery(window).trigger('size-known');
                return true;
            }
            return false;
        },
        'evenSideElement' : jQuery('#evenSide'),
        'oddSideElement' : jQuery('#oddSide'), 
        'defaultError' : function(xhr, status) {
            if (jQuery('#errorPopin').length <= 0) {
                jQuery('#main').append('<div id="errorPopin"></div>');
            }
            jQuery('#bookPages, #pagesBefore, #pagesAfter, #pagesSlider').hide();
            jQuery('#errorPopin').text(this.error_message + ' (Err. ' + xhr.status + ')').show();
        },
        'modelmapping': {
            'default': 'iframe'
        }
    };

    var _bookName, _publication, _selectedBook, _pages, 
        _displayedPage, _displayedBook, _zoomWindow, _winHeight, _winWidth, 
        _numberOfPages, _isZoomed, _zoomedPageHeight, _zoomedPageWidth, 
        _zoomMouseInit, _zoomPosInit, _zoomedPages, _zoomMouseDown, _step,
        _HDgridContainer;
        
    _step = 21; // TODO: settingsify this
    
    this.bindButtons = function() {
        jQuery('#previousButton, #previousCorner').click(this.showPreviousPage);
        jQuery('#nextButton, #nextCorner').click(this.showNextPage);
        jQuery('#firstButton').click(this.showFirstPage);
        jQuery('#lastButton').click(this.showLastPage);
        jQuery('#evenSide, #oddSide').click(this.zoom); // TODO: there are settings for those elements, but i wonder if it makes sense.
    };
    
    this.unbindButtons = function() {
        jQuery('#previousButton, #previousCorner').unbind("click", this.showPreviousPage);
        jQuery('#nextButton, #nextCorner').unbind("click", this.showNextPage);
        jQuery('#firstButton').unbind("click", this.showFirstPage);
        jQuery('#lastButton').unbind("click", this.showLastPage);
        jQuery('#evenSide, #oddSide').unbind("click", this.zoom);
    };
    
    this.bindKeyboard = function() {
        jQuery(document).bind('keydown', this.keyboardCallback);
    };
    
    this.unbindKeyboard = function() {
        jQuery(document).unbind('keydown', this.keyboardCallback);
    };
    
    this.zoom = function(event) {
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
        self.zoomAtCoordinates(x, y);
        return false;
    };
    
    this.zoomAtCoordinates = function(x, y) {
        if (!this.canZoom()) {
            this.restrictedAccess();
            return false;
        }
        if (_isZoomed) {
            return false;
        }
        jQuery(document).trigger('page-beforezoom', [_displayedPage]);

        x = x * this.zoomFactor;
        y = y * this.zoomFactor;

        _zoomedPageHeight = this.pageHeight * this.zoomFactor;
        _zoomedPageWidth = this.pageWidth * this.zoomFactor;
        
        jQuery('#pagesSlider').hide();
        jQuery('#bookSwitcher').hide();
        
        var height = jQuery(window).height();
        jQuery(document.body).css({'overflow': 'hidden', 'height': height });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        _zoomWindow = jQuery(document.createElement('div'));
        _zoomWindow.attr('id', 'zoomWindow');
        _zoomWindow.addClass('grab');

        this.zoomResize();
        
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
        top = this.zoomTopInArea(top);
        
        if (_numberOfPages == 1 && x > _zoomedPageWidth) {
            x = x - _zoomedPageWidth;
        }
        var left = x - (_winWidth / 2);
        left = this.zoomLeftInArea(left);
        _zoomedPages.css({'height': _zoomedPageHeight, 'width': _numberOfPages * _zoomedPageWidth, 'top': -top, 'left': -left});
        
        _zoomWindow.append(_zoomedPages);
        _zoomWindow.dblclick(this.quitZoom);
        
        _zoomWindow.mousedown(this.zoomMouseDown);
        _zoomWindow.mouseup(this.zoomMouseUp);
        _zoomWindow.mousemove(this.zoomMouseMove);
        jQuery(document.body).mouseleave(this.zoomMouseUp);
        jQuery(document.body).bind('mousewheel', this.zoomMouseWheel);
        jQuery(document.body).addClass('zoomed');
        jQuery(window).bind('resize', this.zoomResize);
        
        jQuery(document.body).append(_zoomWindow);
        
        // Just for Apple touch, jQuery suxx and delete e.touches
        var zw = jQuery('#zoomWindow');
        if (zw && zw.addEventListener) {
            // TODO: use jquery event binder to handle ie 7-8
            zw.addEventListener('touchstart', this.zoomMouseDown, true);
            zw.addEventListener('touchend', this.zoomMouseUp, true);
            zw.addEventListener('touchmove', this.zoomMouseMove, true);
        }
        
        this.zoomInitHDGrid(top, left);
        _isZoomed = true;
        jQuery('#zoomButton').addClass('unzoom');
        jQuery(document).trigger('page-afterzoom', [_displayedPage]);
    };
    
    this.zoomInitHDGrid = function(top, left) {
        _HDgridContainer = jQuery(document.createElement('div'));
        _HDgridContainer.css({'height': _zoomedPageHeight, 'width': _numberOfPages * _zoomedPageWidth, 'top': -top, 'left': -left});
        _HDgridContainer.attr('id', 'HDGrid');
        
        var nbZones = _numberOfPages * this.imagesPerRow * this.imagesPerColumn;
        var xRowSize = Math.floor(_zoomedPageWidth / this.imagesPerRow);
        var yColumnSize = Math.floor(_zoomedPageHeight / this.imagesPerColumn);
        
        for (var i = 0; i < nbZones; i++) {
            var img = jQuery(document.createElement('img'));
            img.addClass('grid');
            img.css({'height': yColumnSize, 'width': xRowSize});
            _HDgridContainer.append(img);
        }
        _zoomWindow.append(_HDgridContainer);
        
        this.zoomHighDefAtCoordinates(left, top);
    };
    
    this.quitZoom = function() {
        jQuery(document).trigger('page-leavezoom', [_displayedPage]);
        jQuery(_zoomWindow).detach();
        jQuery(window).unbind('resize', this.zoomResize);
        jQuery(document.body).unbind('mousewheel');
        jQuery(document.body).removeClass('zoomed');        
        jQuery('#pagesSlider').show();
        jQuery('#bookSwitcher').show();
        jQuery(document.body).css({'overflow': 'visible', 'height': 'auto' });
        _isZoomed = false;
        jQuery('#zoomButton').removeClass('unzoom');
        return false;
    };
    
    this.zoomResize = function() {
        var win = jQuery(window);
        _winHeight = win.height();
        _winWidth = win.width();
    };
    
    this.keyboardCallback = function(e) {
        if (jQuery('#DOMWindow').length <= 0) {
            if (_isZoomed) {
                return self.zoomedKeyboardCallback(e);
            } else {
                return self.normalKeyboardCallback(e);        
            }
        }
    };
    
    this.normalKeyboardCallback = function(e) {
        if (e.ctrlKey) {
            switch (e.which) {
                case 109: // -
                case 40:  // bottom
                    e.preventDefault();
                    break;
                case 61:  // =
                case 107: // +
                case 38:  // up
                    self.zoom(e);
                    e.preventDefault();
                    break;
                case 35: // end
                    self.showLastPage(e);
                    break;
                case 36: // home
                    self.showFirstPage(e);
                    break;                
                case 37: // left
                    self.showPreviousPage(e);
                    break;
                case 39: // right
                    self.showNextPage(e);
                    break;
                default:
                    break;
            }
        }
    };
    
    this.zoomedKeyboardCallback = function(e) {
        this.zoomLoadPosInit();
        var x = 0;
        var y = 0;
        if (e.ctrlKey) {
            switch (e.which) {
                case 27:  // esc
                case 109: // -
                case 40: // bottom
                    self.quitZoom();
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        } else {
            switch (e.which) {
                 case 27:  // esc
                    self.quitZoom();
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
            self.zoomBy(x, y);
            e.preventDefault();
        }
    };
    
    this.zoomLoadPosInit = function() {
        _zoomPosInit = {x: -parseInt(_zoomedPages.css('left'), 10), y: -parseInt(_zoomedPages.css('top'), 10)};
    };
    
    this.zoomMouseDown = function(e) {
        // iPhone/iPad
        e.preventDefault();
        if (e.touches) {
            e = e.touches[0];
        }

        _zoomMouseDown = true;
        self.zoomLoadPosInit();
        _zoomMouseInit = {x: e.clientX, y: e.clientY};
        _zoomWindow.addClass('grabbing');
        _zoomWindow.removeClass('grab');        
    };
    
    this.zoomMouseUp = function(e) {
        _zoomMouseDown = false;
        _zoomWindow.addClass('grab');
        _zoomWindow.removeClass('grabbing');
        e.preventDefault();
        
        self.zoomHighDefAtCoordinates(-parseInt(_zoomedPages.css('left'), 10), -parseInt(_zoomedPages.css('top'), 10));
    };
    
    this.zoomMouseMove = function(e) {
        if (_zoomMouseDown !== true) {
            return;
        }
        e.preventDefault();
        // iPhone/iPad
        if (e.touches) {
            e = e.touches[0]; // TODO: wtf ? why would we want to lose datas
        }

        self.zoomBy(_zoomMouseInit.x - e.clientX, _zoomMouseInit.y - e.clientY);
    };
    
    this.zoomMouseWheel = function(e, deltaX, deltaY) {
        self.zoomLoadPosInit();
        self.zoomBy(-_step * deltaX, -_step * deltaY);
        e.preventDefault();
    };
    
    this.zoomBy = function(x, y) {
        var newLeft = _zoomPosInit.x + (x);
        var newTop = _zoomPosInit.y + (y);
        
        newLeft = self.zoomLeftInArea(newLeft);
        newTop = self.zoomTopInArea(newTop);
        
        _zoomedPages.css({'left': -newLeft, 'top': -newTop});
        _HDgridContainer.css({'left': -newLeft, 'top': -newTop});
    };
    
    this.zoomLeftInArea = function(left) {
        if (left < 0) {
            left = 0;
        }
        if (left > _numberOfPages * _zoomedPageWidth - _winWidth) {
            left = _numberOfPages * _zoomedPageWidth - _winWidth;
        }
        
        return left;
    };
    this.zoomTopInArea = function(top) {
        if (top < 0) {
            top = 0;
        }
        if (top > _zoomedPageHeight - _winHeight)
        {
            top = _zoomedPageHeight - _winHeight;
        }
        return top;
    };
    
    this.zoomHighDefAtCoordinates = function(x, y) {
        x = x + (_winWidth / 2);
        y = y + (_winHeight / 2);
        
        var xRowSize = _zoomedPageWidth / this.imagesPerRow;
        var yColumnSize = _zoomedPageHeight / this.imagesPerColumn;
            
        var xRow = Math.floor(x / xRowSize);
        var yColumn = Math.floor(y / yColumnSize);
        this.getZoomImage(xRow, yColumn);
        
        for (var i = 0; i < _numberOfPages * this.imagesPerRow + this.imagesPerColumn; i++) {
            for (var j = 0; j < i; j++) {
                var plop = i - j;
                this.getZoomImage(xRow - j, yColumn - plop);
                this.getZoomImage(xRow + j, yColumn + plop);
                this.getZoomImage(xRow - plop, yColumn + j);
                this.getZoomImage(xRow + plop, yColumn - j);
            }
        }
    };
    
    this.getZoomImage = function(xRow, yColumn) { // TODO: dafuq names
        if (xRow < 0 || yColumn < 0) {
            return;
        }
        
        if (yColumn >= this.imagesPerColumn) {
            return;
        }

        if (_displayedPage === 0) {
            // If _displayedPage is 0, it means we are displaying the first page,
            // which is alone on the *right* hand side.
            // Constraints need to change in that case, to allow the coordinates 
            // on the right (where the first page is) and disallow the ones on the left
            // (where there isn't any page)
            if (xRow >= 2 * this.imagesPerRow || xRow < this.imagesPerRow) {
                return;
            }
        } else {
            if (xRow >= _numberOfPages * this.imagesPerRow) {
                return;
            }
        }

        var imgIndex = 0;
        if (_displayedPage === 0) {
            // Another hack for the first page: there are only half the number of images,
            // the indexing need to be changed. (Note: we don't want to change xRow and yColumn
            // directly, the web services expect x to be > imagesPerRow on the right page, 
            // even if it's the first one!)
            imgIndex = yColumn * this.imagesPerRow + xRow - this.imagesPerRow;
        } else {
            imgIndex = yColumn * this.imagesPerRow * _numberOfPages + xRow;
        }
        
        var img = _HDgridContainer.children().eq(imgIndex);
        if (!img) {
            return;
        }
        
        if (img.attr('src')) {
            return;
        }
        
        var currentPage = _pages[_displayedPage + Math.floor(xRow / this.imagesPerRow)];
        if (!currentPage) {
            return;
        }
        if (currentPage.pageId <= 0) {
            img.css({'visibility' : 'hidden'});
        } else {
            var replaces = {
                '{format}': 'png',
                '{id}': currentPage.pageId,
                '{crop}': this.imagesPerRow + 'x' + this.imagesPerColumn,
                '{x}': xRow,
                '{y}': yColumn
            };
            
            var src = this.paper_page_cropped;
            var k;
            for (k in replaces) {
                src = src.replace(k, replaces[k]);
            }
            img.attr('src', src);
        }
    };
    
    this.showHoverCorner = function() {
        jQuery(this).css('opacity', 1);
    };
    this.hideHoverCorner = function() {
        jQuery(this).css('opacity', 0);
    };
    
    this.displayPagination = function() {
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
        readerSlider.moveIntoView(_displayedPage); // TODO
    };
    
    this.showPage = function(number) {
        var newDisplayedPage = number - number % 2;
        
        // Non-existant page, nothing to do
        if (!_pages[newDisplayedPage] && !_pages[newDisplayedPage + 1]) {
            return;
        }
        
        jQuery('#oddSide .pageInfo, #evenSide .pageInfo').fadeOut();
        
        this.unbindButtons();
        this.unbindKeyboard(); // TODO: get rid of that please ? .live ?
        
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
        
        transitionElement.animate({'width': 2 * finalWidth}, function() { 
            self.cleanAfterShowPage(number); 
            jQuery(this).parent().detach();
        });
    };
    
    this.hideOldPages = function() {
        if (typeof _displayedPage != "undefined") {
            if (_pages[_displayedPage]) {
                _pages[_displayedPage].hide();
            }
            if (_pages[_displayedPage + 1]) {
                _pages[_displayedPage + 1].hide();
            }
        }
        this.unHighlightCurrentPages();
    };
    
    this.displayPage = function(number) {
        var page = _pages[number];
        page.show();
        this.highlightCurrentPages(_displayedBook, number);
        var elm = jQuery('#' + ((page.pageNumber % 2 === 0) ? 'even' : 'odd') + 'Side .pageInfo');
        elm.html(page.getPageInfo());
        elm.fadeIn();
    };
    
    this.bookDisplayed = function() {
        return _displayedBook;
    };
    
    this.pageDisplayed = function() {
        return _displayedPage;
    };
    
    this.cleanAfterShowPage = function(number) {
        this.hideOldPages();

        var newDisplayedPage = number - number % 2;
        if (_pages[newDisplayedPage] || _pages[newDisplayedPage + 1]) {
            _displayedPage = newDisplayedPage;
            window.location.hash = "#!/" + _displayedBook + '_' + _displayedPage;               
        }

        var showRestrictedAccess = false;
        var shownPages = [];
        if (_pages[_displayedPage]) {
            shownPages.push(_displayedPage);
            this.displayPage(_displayedPage);
            if (!_pages[newDisplayedPage].canAccess()) {
                showRestrictedAccess = true;
            }
        }
        if (_pages[_displayedPage + 1]) {
            shownPages.push(_displayedPage + 1);
            this.displayPage(_displayedPage + 1);
            if (!_pages[newDisplayedPage + 1].canAccess()) {
                showRestrictedAccess = true;
            }
        }
        
        if (showRestrictedAccess) {
            // show "access restricted" lightbox if the displayed page
            // is restricted - the user will be able to close it, 
            // it's just to remind him the page isn't free
            this.restrictedAccess();
        }        
        this.displayPagination();
        this.bindButtons();
        this.bindKeyboard();
        jQuery(document).trigger('pages-shown', [_displayedBook, shownPages]);
    };
        
    this.showSelectedPage = function(e) {
        e.preventDefault();
        var tmp = self.parseHashtoGetParams(this.href.split('#!/')[1]);
        var newDisplayedBook = tmp[0];
        var newDisplayedPage = tmp[1] - tmp[1] % 2;
        
        if (newDisplayedBook != _displayedBook) {
            self.showBook(newDisplayedBook, newDisplayedPage);
        } else if (newDisplayedPage != _displayedPage) {
            self.showPage(newDisplayedPage);
        }
    };
    
    this.showPreviousPage = function(e) {
        e.preventDefault();
        self.showPage(_displayedPage - 2);
    };
    this.showNextPage = function(e) {
        e.preventDefault();
        self.showPage(_displayedPage + 2);
    };
    this.showFirstPage = function(e) {
        e.preventDefault();
        self.showPage(0);
    };
    this.showLastPage = function(e) {
        e.preventDefault();
        self.showPage(_selectedBook.pagination);
    };
    
    this.sizeKnown = function(e) {
        var sides = jQuery('#evenSide, #oddSide');
        sides.width(self.pageWidth);
        sides.css('max-height', self.pageHeight + 'px');
        var parent = sides.parent();
        if (parent) {
            parent.width(sides.outerWidth() * 2);
        }
        jQuery(window).unbind(e);
    };
    
    this.unHighlightHoveredPages = function(e) {
        jQuery('#pagesList a.hovered').removeClass('hovered');
    };
    
    this.unHighlightCurrentPages = function(e) {
        jQuery('#pagesList a.current').removeClass('current');
    };
    
    this.highlightCurrentPages = function(book, page) {
        var current = jQuery('#thumb_' + book + '_' + page);
        current.addClass('current');        
    };
      
    this.highlightHoveredPages = function (e) {
        // remove old highlight
        self.unHighlightHoveredPages();

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
    };
    
     this.changeBook = function(newBook) {
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
            this.defaultError({'status' : 418});
            return false;
        }
        return true;
    };
    
    this.showBook = function (bookToShow, possiblePage) {

        this.hideOldPages();
        if (!this.changeBook(bookToShow)) {
            return false;
        }
        
        var pageToShow = 0;
        if (possiblePage >= 0 && possiblePage <= _selectedBook.pagination) {
            pageToShow = possiblePage;
        }

        jQuery(window).bind('size-known', this.sizeKnown);
        
        _pages = new Array(parseInt(_selectedBook.pagination, 10));
        for (var i = 0; i < _selectedBook.pages.length; i++) {
            var page = _selectedBook.pages[i];
            _pages[page.page_number] = new Page(this, page.page_number, page.id, page.paper_channel, page.maps);
        }
        for (i = 1; i <= _selectedBook.pagination; i++) {
            if (!_pages[i]) {
                _pages[i] = new Page(this, i);
            }
            var a = _pages[i].getThumbnailForList(_displayedBook, 'smallest');
            a.attr({'id' : 'thumb_' + _displayedBook + '_' + i});
            jQuery('#pagesList').append(a);
            a.bind('click', this.showSelectedPage);
            a.bind('mouseover', this.highlightHoveredPages);
        }
        jQuery(document).trigger('book-load', [_selectedBook, _displayedBook]);
        this.showPage(pageToShow);
    };
    
    this.findPageFromId = function(id) {
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
    };
    
    this.parseHashtoGetParams = function (hash) {
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
    };
    
    this.handlePublication = function(data) {
        _publication = data;
        
        // If the publication data contains an access level, use it as the new
        // access level needed.
        if (typeof data.access !== 'undefined') {
            self.changeAccessLevelNeeded(parseInt(data.access, 10));
        }

        jQuery('#pagesList').bind('mouseout', self.unHighlightHoveredPages);
        
        // Trigger a first event before showing any pages
        jQuery(document).trigger('publication-beforeload', [_publication, self.publicationId]);
        
        var tmp = [0, 0];
        if (location.hash !== "") {
            tmp = self.parseHashtoGetParams(location.hash.split('#!/')[1]);
        }
        
        self.showBookList(); // call first, so that we can play with the list in showBook()
        self.showBook((tmp[0] || 0), (tmp[1] || 0));
        
        jQuery(document).trigger('publication-load', [data, self.publicationId]);
    };
    
    this.showBookList = function() {
        var len = _publication.books.length;
        for (var i = 0; i < len; i++) {
            var page = _publication.books[i].pages[0];
            var obj;
            if (typeof page == 'undefined' || !page || page.page_number > 1) {
                // First page should always be numbered 1. If it's non existant
                // or if it's not numbered 1, then the first page is still in
                // construction... Fake it.
                obj = new Page(this, 1);
            } else {
                obj = new Page(this, page.page_number, page.id, page.paper_channel, page.maps);
            }
            
            var a = obj.getThumbnailForList(i);
            a.attr('id', "bookThumb-" + i);
            a.append('<span class="bookName">' + _publication.books[i].name + '</span>');
            jQuery('#bookSwitcher').append(a);
            a.bind('click', this.showSelectedPage);
        }
    };

    this.init = function() {
        if (settings.publicationId == 'undefined') {
            throw "What the fuck man ?! are you drunk ? there is no publicationId !"; // TODO
            return false;
        }

        jQuery.extend(this, this.default_settings, settings);

        function readerInitCallback(data, textStatus, xhrobject) {
            try {
                self.accessLevel = data['access_level'];
                jQuery.ajax({
                    url: self.publication.replace('{format}', 'json').replace('{id}', self.publicationId),
                    dataType: "json",
                    success: self.handlePublication,
                    error: self.defaultError
                });
        
                // TODO: this has nothing to do here
                jQuery('#zoomButton').click(function (e) {
                    if (_isZoomed) {
                        self.quitZoom();
                    } else {
                        self.zoomAtCoordinates(0, 0);
                    }
                    return false;
                });
                // TODO: this either
                jQuery('#previousCorner, #nextCorner').hover(self.showHoverCorner, self.hideHoverCorner);
            } catch (e) {
                console.log(e); // TODO
                throw e;
            }
        }

        // TODO: move this in a more appropriate place
        if (this.pageHeight) {
            jQuery('#bookPages').height(this.pageHeight);
        }

        jQuery.ajax({
            'url': this.token.replace('{format}', 'json'),
            'type': 'post',
            'data' : {'use_session' : 1 },
            'dataType': 'json',
            'success': readerInitCallback,
            'error': readerInitCallback
        });
    };
    
    // here we go
    this.init();
};
