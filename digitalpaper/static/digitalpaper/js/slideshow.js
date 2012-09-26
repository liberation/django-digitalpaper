var readerSlider = function() {
    var iSlideSize = 150;
    var sSlideSpeed = 'slow';
    var continueMoving = false;

    function prev(e) {
        continueMoving = true;
        moveBy(iSlideSize);
        e.preventDefault();
    }
    
    function next(e) {
        continueMoving = true;    
        moveBy(-iSlideSize);
        e.preventDefault();
    }
    
    function cancel() {
        continueMoving = false; 
    }
    
    function moveBy(value) {
        if (continueMoving) {
            var currentPosition = parseInt(jQuery('#pagesList').css('left'), 10);
            moveTo(currentPosition + value, function() { moveBy(value); });
        } else {
            jQuery('#pagesList').clearQueue();
        }
    }
    
    function moveIntoView(itemNumber) {
        if (itemNumber < 1) {
            // The page "0" doesn't exist, but can be passed as an argument when
            // we are viewing the first page
            itemNumber = 1;
        }
        var child = jQuery('#pagesList').children()[itemNumber - 1];
        if (child) {
            var childPosition = jQuery(child).position()['left'];
            var outerWidth = jQuery('#innerPagesSlider').outerWidth();
            moveTo(-(childPosition - outerWidth + outerWidth / 2 + jQuery(child).outerWidth()));
        }
    }
    
    function restrictPositionValue(value) {
        var minPosition = 0;
        var maxPosition = jQuery('#pagesList').outerWidth() - jQuery('#innerPagesSlider').outerWidth();
        
        if (value < -maxPosition) {
            value = -maxPosition;
            continueMoving = false;
            return value;
        }
        
        if (value > minPosition) { 
            value = minPosition;
            continueMoving = false;
            return value;
        }
        
        return value;
    }
    
    function moveTo(value, callback) {
        value = restrictPositionValue(value);
        jQuery('#pagesList').animate({ left: value }, sSlideSpeed, 'linear', function() {
            if (typeof callback != 'undefined') {
                callback();
            }
        });
    }
    
    return {
        'prev' : prev,
        'next' : next,
        'cancel' : cancel,
        'moveIntoView' : moveIntoView
    };
}();

jQuery(document).ready(function() {
    jQuery('#sliderPrev').bind('mousedown', readerSlider.prev);
    jQuery('#sliderNext').bind('mousedown', readerSlider.next);
    jQuery('#sliderPrev').bind('click', function(e) { e.preventDefault(); });
    jQuery('#sliderNext').bind('click', function(e) { e.preventDefault(); });
    jQuery(document).bind('mouseup', readerSlider.cancel);
});
