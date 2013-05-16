function Reader(settings) {
    var self = this;
    /********************* DEFAULT settings **********************/
    var default_settings = {
        /********* mandatory settings (have to be overwriten) **********/
        'publicationId' : null,
        /********* end of mandatory settings *******/

        /********* urls **********/
        "pageLimitedAccessImage": '/static/digitalpaper/img/page-only-subscribers.png',
        "pageUnderConstructionImage": '/static/digitalpaper/img/page-under-construction.png',
        "pageUnderConstructionImageSmallest": '/static/digitalpaper/img/page-under-construction_smallest.png',
        "token": '/digitalpaper/token/',
        "publication": '/digitalpaper/publication/{id}/',
        "reader_by_date": '/digitalpaper/date/{date}/',
        "paper_page_resized": '/digitalpaper/page/{id}/',
        "paper_page_cropped": '/digitalpaper/page/{id}/',
        /****** end of urls ******/

        /********** markup ************/
        // TODO: why not create all these elements dinamycally ?
        // its a pain to follow a given markup
        'evenSideElement': jQuery('#evenSide'),
        'oddSideElement': jQuery('#oddSide'),
        'restrictedAccessElement': jQuery('#restrictedAccess'),
        'previousButtonElement': jQuery('#previousButton'),
        'nextButtonElement': jQuery('#nextButton'),
        'firstButtonElement': jQuery('#firstButton'),
        'lastButtonElement': jQuery('#lastButton'),
        'previousCornerElement': jQuery('#previousCorner'),
        'nextCornerElement': jQuery('#nextCorner'),
        'previousButtonsParent': jQuery('#pagesBefore'),
        'nextButtonsParent': jQuery('#pagesAfter'),
        'zoomButtonElement': jQuery('#zoomButton'),
        'bookSwitcherElement': jQuery('#bookSwitcher'),
        'pagesSliderElement': jQuery('#pagesSlider'),
        'bookSwitcherElement': jQuery('#bookSwitcher'),
        'evenPageInfoElement': jQuery('#evenSide .pageInfo'),
        'oddPageInfoElement': jQuery('#oddSide .pageInfo'),
        'bookPagesElement': jQuery('#bookPages'),
        'contentmodelContentElement': jQuery('#contentmodelContent'),
        'pagesListElement': jQuery('#pagesList'),
        /******* end of markup ********/

        'accessLevelNeeded' : 1,
        'pageWidth': 354,
        'pageHeight': 500,
        'pageThumbnailWidth': 104,
        'pageThumbnailHeight': 148,
        'pagesFree': [1],
        'error_message': "Something terrible just happened.",
        'imagesPerRow': 4,
        'imagesPerColumn': 4,
        'zoomFactor': 4,
        'animationStep': 21,
    };
        
    this.checkAccessLevel = function() {
        return this.token_data.access_level >= this.accessLevelNeeded;
    };
    this.canAccess = function(pageNumber, pageId) {
        return this.checkAccessLevel() || jQuery.inArray(pageNumber, this.pagesFree) >= 0;
    };
    this.canZoom = function(pageNumber, pageId) {
        return this.checkAccessLevel() && this.pageWidth && this.pageHeight;
    };
    this.canUseMap = function(pageNumber, pageId) {
        return this.checkAccessLevel() && this.pageWidth && this.pageHeight;
    };
    this.restrictedAccess = function() {
        jQuery.colorbox({
            iframe: false,
            inline: true,
            href: self.restrictedAccessElement,
            width: 760,
            height: 480,
            onOpen: function() {
                self.restrictedAccessElement.show();
            },
            onClosed: function() {
                self.restrictedAccessElement.hide();
            }
        });
    };
    this.setSize = function(w, h) {
        if (w) {
            this.pageWidth = w;
            this.pageThumbnailWidth = parseInt(w * this.pageThumbnailHeight / this.pageHeight, 10);
            jQuery(window).trigger('size-known');
            return true;
        }
        return false;
    };

    this.defaultError = function(xhr, status) {
        if (jQuery('#errorPopin').length <= 0) {
            jQuery('body').append('<div id="errorPopin"></div>');
        }
        self.bookPagesElement.hide();
        self.previousButtonsParent.hide();
        self.nextButtonsParent.hide();
        self.pagesSliderElement.hide();
        jQuery('#errorPopin').text(self.error_message + ' (Err. ' + xhr.status + ')').show();
    };
    
    this.modelmapping = {
        'default': 'iframe'
    };

    // TODO: make some methods be private to cleanup the object prototype, also cleanup some of these 'private' vars
    var _bookName, _publication, _selectedBook, _pages, 
        _displayedPage, _displayedBook, _zoomWindow, _winHeight, _winWidth, 
        _numberOfPages, _isZoomed, _zoomedPageHeight, _zoomedPageWidth, 
        _zoomMouseInit, _zoomPosInit, _zoomedPages, _zoomMouseDown,
        _HDgridContainer;

    var bindButtons = function() {
        self.previousButtonElement.click(self.showPreviousPage);
        self.previousCornerElement.click(self.showPreviousPage);
        self.nextButtonElement.click(self.showNextPage);
        self.nextCornerElement.click(self.showNextPage);
        self.firstButtonElement.click(self.showFirstPage);
        self.lastButtonElement.click(self.showLastPage);
        self.evenSideElement.click(self.zoom);
        self.oddSideElement.click(self.zoom);
    };
    
    var unbindButtons = function() {
        self.previousButtonElement.unbind("click", self.showPreviousPage);
        self.previousCornerElement.unbind("click", self.showPreviousPage);
        self.nextButtonElement.unbind("click", self.showNextPage);
        self.nextCornerElement.unbind("click", self.showNextPage);
        self.firstButtonElement.unbind("click", self.showFirstPage);
        self.lastButtonElement.unbind("click", self.showLastPage);
        self.evenSideElement.unbind("click", self.zoom);
        self.oddSideElement.unbind("click", self.zoom);
    };
    
    var bindKeyboard = function() {
        jQuery(document).bind('keydown', keyboardCallback);
    };
    
    var unbindKeyboard = function() {
        jQuery(document).unbind('keydown', keyboardCallback);
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
        
        this.pagesSliderElement.hide(); //TODO: clean
        this.bookSwitcherElement.hide();
        
        var height = jQuery(window).height();
        jQuery("body").css({'overflow': 'hidden', 'height': height })
                      .scrollTop(0);
        
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
        _zoomWindow.dblclick(this.quitZoom);
        
        _zoomWindow.mousedown(zoomMouseDown);
        _zoomWindow.mouseup(zoomMouseUp);
        _zoomWindow.mousemove(zoomMouseMove);
        jQuery("body").mouseleave(zoomMouseUp);
        jQuery("body").bind('mousewheel', zoomMouseWheel);
        jQuery("body").addClass('zoomed');
        jQuery(window).bind('resize', zoomResize);
        
        jQuery("body").append(_zoomWindow);
        
        _zoomWindow.bind('touchstart', this.zoomMouseDown, true);
        _zoomWindow.bind('touchend', this.zoomMouseUp, true);
        _zoomWindow.bind('touchmove', this.zoomMouseMove, true);
        
        zoomInitHDGrid(top, left);
        _isZoomed = true;
        this.zoomButtonElement.addClass('unzoom');
        jQuery(document).trigger('page-afterzoom', [_displayedPage]);
    };
    
    var zoomInitHDGrid = function(top, left) {
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
        
        zoomHighDefAtCoordinates(left, top);
    };
    
    this.quitZoom = function() {
        jQuery(document).trigger('page-leavezoom', [_displayedPage]);
        jQuery(_zoomWindow).detach();
        jQuery(window).unbind('resize', zoomResize);
        jQuery("body").unbind('mousewheel')
                      .removeClass('zoomed')
                      .css({'overflow': 'visible', 'height': 'auto' });
        self.pagesSliderElement.show();
        self.bookSwitcherElement.show();
        _isZoomed = false;
        self.zoomButtonElement.removeClass('unzoom');
        return false;
    };
    
    var zoomResize = function() {
        var win = jQuery(window);
        _winHeight = win.height();
        _winWidth = win.width();
    };
    
    var keyboardCallback = function(e) {
        if (jQuery('#colorbox').css('display') != 'block') {
            if (_isZoomed) {
                return zoomedKeyboardCallback(e);
            } else {
                return normalKeyboardCallback(e);        
            }
        }
    };
    
    var normalKeyboardCallback = function(e) {
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
    
    var zoomedKeyboardCallback = function(e) {
        zoomLoadPosInit();
        var x = 0;
        var y = 0;
        if (e.ctrlKey) {
            switch (e.which) {
                case 27:  // esc
                case 109: // -
                case 40: // bottom
                    self.quitZoom();
                    e.preventDefault();
                case 107:
                case 38:
                case 61:
                    e.prevenDefault();
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
                    x = -this.animationStep;
                    break;
                case 38: // up
                    y = -this.animationStep;
                    break;
                case 39: // right
                    x = this.animationStep;
                    break;
                case 40: // bottom
                    y = this.animationStep;
                    break;
                default:
                    break;
            }
        }
        if (x || y) {
            zoomBy(x, y);
            e.preventDefault();
        }
    };
    
    var zoomLoadPosInit = function() {
        _zoomPosInit = {x: -parseInt(_zoomedPages.css('left'), 10), y: -parseInt(_zoomedPages.css('top'), 10)};
    };
    
    var zoomMouseDown = function(e) {
        // iPhone/iPad
        e.preventDefault();
        if (e.touches) {
            e = e.touches[0];
        }

        _zoomMouseDown = true;
        zoomLoadPosInit();
        _zoomMouseInit = {x: e.clientX, y: e.clientY};
        _zoomWindow.addClass('grabbing');
        _zoomWindow.removeClass('grab');        
    };
    
    var zoomMouseUp = function(e) {
        _zoomMouseDown = false;
        _zoomWindow.addClass('grab');
        _zoomWindow.removeClass('grabbing');
        e.preventDefault();
        
        zoomHighDefAtCoordinates(-parseInt(_zoomedPages.css('left'), 10), -parseInt(_zoomedPages.css('top'), 10));
    };
    
    var zoomMouseMove = function(e) {
        if (_zoomMouseDown !== true) {
            return;
        }
        e.preventDefault();
        // iPhone/iPad
        if (e.touches) {
            e = e.touches[0]; // TODO: wtf ? why would we want to lose datas
        }

        zoomBy(_zoomMouseInit.x - e.clientX, _zoomMouseInit.y - e.clientY);
    };
    
    var zoomMouseWheel = function(e, deltaX, deltaY) {
        zoomLoadPosInit();
        zoomBy(-this.animationStep * deltaX, -this.animationStep * deltaY);
        e.preventDefault();
    };
    
    var zoomBy = function(x, y) {
        var newLeft = _zoomPosInit.x + (x);
        var newTop = _zoomPosInit.y + (y);
        
        newLeft = zoomLeftInArea(newLeft);
        newTop = zoomTopInArea(newTop);
        
        _zoomedPages.css({'left': -newLeft, 'top': -newTop});
        _HDgridContainer.css({'left': -newLeft, 'top': -newTop});
    };
    
    var zoomLeftInArea = function(left) {
        if (left < 0) {
            left = 0;
        }
        if (left > _numberOfPages * _zoomedPageWidth - _winWidth) {
            left = _numberOfPages * _zoomedPageWidth - _winWidth;
        }
        
        return left;
    };
    var zoomTopInArea = function(top) {
        if (top < 0) {
            top = 0;
        }
        if (top > _zoomedPageHeight - _winHeight)
        {
            top = _zoomedPageHeight - _winHeight;
        }
        return top;
    };
    
    var zoomHighDefAtCoordinates = function(x, y) {
        x = x + (_winWidth / 2);
        y = y + (_winHeight / 2);
        
        var xRowSize = _zoomedPageWidth / this.imagesPerRow;
        var yColumnSize = _zoomedPageHeight / this.imagesPerColumn;
            
        var xRow = Math.floor(x / xRowSize);
        var yColumn = Math.floor(y / yColumnSize);
        getZoomImage(xRow, yColumn);
        
        for (var i = 0; i < _numberOfPages * self.imagesPerRow + self.imagesPerColumn; i++) {
            for (var j = 0; j < i; j++) {
                var plop = i - j;
                getZoomImage(xRow - j, yColumn - plop);
                getZoomImage(xRow + j, yColumn + plop);
                getZoomImage(xRow - plop, yColumn + j);
                getZoomImage(xRow + plop, yColumn - j);
            }
        }
    };
    
    var getZoomImage = function(xRow, yColumn) { // TODO: dafuq names
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
            if (xRow >= 2 * self.imagesPerRow || xRow < self.imagesPerRow) {
                return;
            }
        } else {
            if (xRow >= _numberOfPages * self.imagesPerRow) {
                return;
            }
        }

        var imgIndex = 0;
        if (_displayedPage === 0) {
            // Another hack for the first page: there are only half the number of images,
            // the indexing need to be changed. (Note: we don't want to change xRow and yColumn
            // directly, the web services expect x to be > imagesPerRow on the right page, 
            // even if it's the first one!)
            imgIndex = yColumn * self.imagesPerRow + xRow - self.imagesPerRow;
        } else {
            imgIndex = yColumn * self.imagesPerRow * _numberOfPages + xRow;
        }
        
        var img = _HDgridContainer.children().eq(imgIndex);
        if (!img) {
            return;
        }
        
        if (img.attr('src')) {
            return;
        }
        
        var currentPage = _pages[_displayedPage + Math.floor(xRow / self.imagesPerRow)];
        if (!currentPage) {
            return;
        }
        if (currentPage.pageId <= 0) {
            img.css({'visibility' : 'hidden'});
        } else {
            var replaces = {
                '{format}': 'png',
                '{id}': currentPage.pageId,
                '{crop}': self.imagesPerRow + 'x' + self.imagesPerColumn,
                '{x}': xRow,
                '{y}': yColumn
            };
            
            var src = self.paper_page_cropped;
            var k;
            for (k in replaces) {
                src = src.replace(k, replaces[k]);
            }
            img.attr('src', src);
        }
    };
    
    var showHoverCorner = function() {
        jQuery(this).css('opacity', 1);
    };
    var hideHoverCorner = function() {
        jQuery(this).css('opacity', 0);
    };
    
    var displayPagination = function() {
        var previousButtons = self.previousCornerElement.add(self.previousButtonsParent);
        if (_displayedPage - 2 >= 0) {
            previousButtons.show();
        } else {
            previousButtons.hide();
        }
        
        var nextButtons = self.nextCornerElement.add(self.nextButtonsParent);
        if (_displayedPage + 2 <= _selectedBook.pagination) {
            nextButtons.show();
        } else {
            nextButtons.hide();
        }
        self.slider.moveIntoView(_displayedPage);
    };
    
    this.showPage = function(number) {
        var newDisplayedPage = number - number % 2;
        
        // Non-existant page, nothing to do
        if (!_pages[newDisplayedPage] && !_pages[newDisplayedPage + 1]) {
            return;
        }
        
        this.evenPageInfoElement.fadeOut();
        this.oddPageInfoElement.fadeOut();
        
        unbindButtons();
        unbindKeyboard();
        
        var evenSide = this.evenSideElement;
        var oddSide =  this.oddSideElement;
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
            cleanAfterShowPage(number); 
            jQuery(this).parent().detach();
        });
    };
    
    var hideOldPages = function() {
        if (typeof _displayedPage != "undefined") {
            if (_pages[_displayedPage]) {
                _pages[_displayedPage].hide();
            }
            if (_pages[_displayedPage + 1]) {
                _pages[_displayedPage + 1].hide();
            }
        }
        unHighlightCurrentPages();
    };
    
    this.displayPage = function(number) {
        var page = _pages[number];
        page.show();
        highlightCurrentPages(_displayedBook, number);
        var elm = page.pageNumber % 2 ? this.oddPageInfoElement : this.evenPageInfoElement;
        elm.html(page.getPageInfo());
        elm.fadeIn();
    };
    
    this.bookDisplayed = function() {
        return _displayedBook;
    };
    
    this.pageDisplayed = function() {
        return _displayedPage;
    };
    
    var cleanAfterShowPage = function(number) {
        hideOldPages();

        var newDisplayedPage = number - number % 2;
        if (_pages[newDisplayedPage] || _pages[newDisplayedPage + 1]) {
            _displayedPage = newDisplayedPage;
            window.location.hash = "#!/" + _displayedBook + '_' + _displayedPage;               
        }

        var showRestrictedAccess = false;
        var shownPages = [];
        if (_pages[_displayedPage]) {
            shownPages.push(_displayedPage);
            self.displayPage(_displayedPage);
            if (!_pages[newDisplayedPage].canAccess()) {
                showRestrictedAccess = true;
            }
        }
        if (_pages[_displayedPage + 1]) {
            shownPages.push(_displayedPage + 1);
            self.displayPage(_displayedPage + 1);
            if (!_pages[newDisplayedPage + 1].canAccess()) {
                showRestrictedAccess = true;
            }
        }
        
        if (showRestrictedAccess) {
            // show "access restricted" lightbox if the displayed page
            // is restricted - the user will be able to close it, 
            // it's just to remind him the page isn't free
            self.restrictedAccess();
        }        
        displayPagination();
        bindButtons();
        bindKeyboard();
        jQuery(document).trigger('pages-shown', [_displayedBook, shownPages]);
    };
        
    var showSelectedPage = function(e) {
        e.preventDefault();
        var tmp = parseHashtoGetParams(this.href.split('#!/')[1]);
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
    
    var sizeKnown = function(e) {
        var sides = self.evenSideElement.add(self.oddSideElement);
        sides.width(self.pageWidth);
        sides.css('max-height', self.pageHeight + 'px');
        var parent = sides.parent();
        if (parent) {
            parent.width(sides.outerWidth() * 2);
        }
        jQuery(window).unbind(e);
    };
    
    var unHighlightHoveredPages = function(e) {
        jQuery('a.hovered', this.pagesListElement).removeClass('hovered');
    };
    
    var unHighlightCurrentPages = function(e) {
        jQuery('a.current', this.pagesListElement).removeClass('current');
    };
    
    var highlightCurrentPages = function(book, page) {
        var current = jQuery('#thumb_' + book + '_' + page);
        current.addClass('current');        
    };
      
    var highlightHoveredPages = function (e) {
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
    };
    
     this.changeBook = function(newBook) {
        if (newBook > _publication.books.length) {
            newBook = 0;
        }
        if (_displayedBook != newBook) {
            this.pagesListElement.empty()
                                 .css({'left' : 0 });
            jQuery(this.bookSwitcherELement+' a').removeClass('selected');
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

        hideOldPages();
        if (!this.changeBook(bookToShow)) {
            return false;
        }
        
        var pageToShow = 0;
        if (possiblePage >= 0 && possiblePage <= _selectedBook.pagination) {
            pageToShow = possiblePage;
        }

        jQuery(window).bind('size-known', sizeKnown);
        
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
            this.pagesListElement.append(a);
            a.bind('click', showSelectedPage);
            a.bind('mouseover', highlightHoveredPages);
        }
        jQuery(document).trigger('book-load', [_selectedBook, _displayedBook]);
        this.showPage(pageToShow);
    };
    
    var findPageFromId = function(id) {
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
    
    var parseHashtoGetParams = function (hash) {
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
    
    var handlePublication = function(data) {
        _publication = data;
        
        // If the publication data contains an access level, use it as the new
        // access level needed.
        if (typeof data.access !== 'undefined') {
            self.accessLevelNeeded = parseInt(data.access, 10);
        }

        self.pagesListElement.bind('mouseout', unHighlightHoveredPages);
        
        // Trigger a first event before showing any pages
        jQuery(document).trigger('publication-beforeload', [_publication, self.publicationId]);
        
        var tmp = [0, 0];
        if (location.hash !== "") {
            tmp = parseHashtoGetParams(location.hash.split('#!/')[1]);
        }
        
        showBookList(); // call first, so that we can play with the list in showBook()
        self.showBook((tmp[0] || 0), (tmp[1] || 0));
        
        // TODO: make it sure it does not break anything, and add a prefix to self evenement
        jQuery(document).trigger('publication-load', [data, self.publicationId]);
    };
    
    var showBookList = function() {
        var len = _publication.books.length;
        for (var i = 0; i < len; i++) {
            var page = _publication.books[i].pages[0];
            var obj;
            if (typeof page == 'undefined' || !page || page.page_number > 1) {
                // First page should always be numbered 1. If it's non existant
                // or if it's not numbered 1, then the first page is still in
                // construction... Fake it.
                obj = new Page(self, 1);
            } else {
                obj = new Page(self, page.page_number, page.id, page.paper_channel, page.maps);
            }
            
            var a = obj.getThumbnailForList(i);
            a.attr('id', "bookThumb-" + i);
            a.append('<span class="bookName">' + _publication.books[i].name + '</span>');
            jQuery(this.bookSwitcherElement).append(a);
            a.bind('click', showSelectedPage);
        }
    };

    var initUI = function () {
        // this method handles everything UI
        // slider
        self.slider = new readerSlider();
        jQuery('#sliderPrev').bind('mousedown', self.slider.prev)
            .bind('click', function(e) { e.preventDefault(); });
        jQuery('#sliderNext').bind('mousedown', self.slider.next)
            .bind('click', function(e) { e.preventDefault(); });
        jQuery(document).bind('mouseup', self.slider.cancel);

        // zoom
        self.zoomButtonElement.click(function (e) {
            if (_isZoomed) {
                self.quitZoom();
            } else {
                self.zoomAtCoordinates(0, 0);
            }
            return false;
        });

        // corners
        self.previousCornerElement.hover(showHoverCorner, hideHoverCorner);
        self.nextCornerElement.hover(showHoverCorner, hideHoverCorner);

        if (self.pageHeight) self.bookPagesElement.height(self.pageHeight);
    };

    var init = function() {
        if (settings.publicationId == 'undefined') {
            throw "What the fuck man ?! are you drunk ? there is no publicationId !";
            return false;
        }
        
        jQuery.extend(self, default_settings, settings);
        for (key in settings) {
            if (typeof(settings[key]) == "object") {
                $.extend(self, settings[key]);
            }
        }

        function readerInitCallback(data, textStatus, xhrobject) {
            try {
                self.token_data = data;
                jQuery(document).trigger('digitalpaper-token-received');
                jQuery.ajax({
                    url: self.publication.replace('{format}', 'json').replace('{id}', self.publicationId),
                    dataType: "json",
                    success: handlePublication,
                    error: self.defaultError
                });
        
                initUI();
            } catch (e) {
            }
        }

        jQuery.ajax({
            'url': self.token.replace('{format}', 'json'),
            'type': 'post',
            'data' : {'use_session' : 1 },
            'dataType': 'json',
            'success': readerInitCallback,
            'error': readerInitCallback
        });
    };
    
    // here we go
    init();
};
