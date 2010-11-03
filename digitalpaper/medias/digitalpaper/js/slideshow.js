jQuery(document).ready(function() {
    var iSlideSize = 296;
    var sSlideSpeed = 'slow';
    var isMoving = false;

    jQuery('#sliderPrev').bind('click', function(e) {
        if (!isMoving) {
            isMoving = true;
            var iPosition = (jQuery('#pagesList').css('left').replace('px', '') * 1) + iSlideSize;
            var minPosition = 0;

            if (iPosition > minPosition) { 
                iPosition = minPosition;
            }

            jQuery('#pagesList').animate({ left: iPosition }, sSlideSpeed, function() {
                isMoving = false;
            });
        }
        return false ;
    }) ;

    jQuery('#sliderNext').bind('click', function(e) {
        if (!isMoving) {
            var maxPosition = jQuery('#pagesList').outerWidth() - jQuery('#innerPagesSlider').outerWidth();
            if (maxPosition > 0) {
                isMoving = true ;
                var iPosition = jQuery('#pagesList').css('left').replace('px', '') - iSlideSize;
                if (iPosition < -maxPosition) { 
                    iPosition = -maxPosition;
                }

                jQuery('#pagesList').animate({ left: iPosition }, sSlideSpeed, function() {
                    isMoving = false ;
                });
            }
        }
        return false;
    });
});
