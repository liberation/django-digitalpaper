jQuery(document).ready(function () {
    iSlideSize = 296;
    sSlideSpeed = 'slow';
    iPosition = 0;

    jQuery('#sliderPrev').bind('mousedown', function(e) {
        iPosition += iSlideSize;
        minPosition = 0
        if (iPosition > minPosition) {
            iPosition = minPosition;
        }
        jQuery('#pagesList').animate({left: iPosition}, sSlideSpeed);
    });
    jQuery('#sliderNext').bind('mousedown', function(e) {
        iPosition -= iSlideSize;
        maxPosition = jQuery('#pagesList').outerWidth() - jQuery('#innerPagesSlider').outerWidth();
        if (maxPosition > 0) {
            if (iPosition < -maxPosition) {
                iPosition = -maxPosition;
            }
            jQuery('#pagesList').animate({left: iPosition}, sSlideSpeed);
        }
    });
});
