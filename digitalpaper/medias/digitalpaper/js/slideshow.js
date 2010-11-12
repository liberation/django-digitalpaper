var readerSlider = function() {
    var iSlideSize = 296;
    var sSlideSpeed = 'slow';
    var isMoving = false;

    function prev() {
        moveBy(iSlideSize);
    }
    
    function next() {
        moveBy(-iSlideSize);
    }
    
    function moveBy(value) {
        var currentPosition = parseInt(jQuery('#pagesList').css('left'), 10);
        moveTo(currentPosition + value);
    }
    
    function moveIntoView(itemNumber) {
        var child = jQuery('#pagesList').children()[itemNumber - 1];
        if (child) {
            var childPosition = jQuery(child).position()['left'];
            var outerWidth = jQuery('#innerPagesSlider').outerWidth();
            moveTo(-(childPosition - outerWidth + outerWidth / 2 + jQuery(child).outerWidth()));
        }
    }
    
    function moveTo(value) {    
        if (!isMoving) {
            var minPosition = 0;
            var maxPosition = jQuery('#pagesList').outerWidth() - jQuery('#innerPagesSlider').outerWidth();
            
            if (value < -maxPosition) { 
                value = -maxPosition;
            }
            
            if (value > minPosition) { 
                value = minPosition;
            }

            isMoving = true;
            jQuery('#pagesList').animate({ left: value }, sSlideSpeed, function() {
                isMoving = false;
            });
        }
    }
    
    return {
        'prev' : prev,
        'next' : next,
        'moveIntoView' : moveIntoView
    }
}();

jQuery(document).ready(function() {
    jQuery('#sliderPrev').bind('click', readerSlider.prev);
    jQuery('#sliderNext').bind('click', readerSlider.next);
});
