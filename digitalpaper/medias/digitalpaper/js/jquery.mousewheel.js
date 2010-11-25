/*! Copyright (c) 2009 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 *
 * Patched by Mathieu Pillard to add horizontal scrolling support
 *
 * Version: 3.0.2patched
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

$.event.special.mousewheel = {
	setup: function() {
		if ( this.addEventListener )
			for ( var i=types.length; i; )
				this.addEventListener( types[--i], handler, false );
		else
			this.onmousewheel = handler;
	},
	
	teardown: function() {
		if ( this.removeEventListener )
			for ( var i=types.length; i; )
				this.removeEventListener( types[--i], handler, false );
		else
			this.onmousewheel = null;
	}
};

$.fn.extend({
	mousewheel: function(fn) {
		return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
	},
	
	unmousewheel: function(fn) {
		return this.unbind("mousewheel", fn);
	}
});


function handler(event) {
	var args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true;
	var deltaX = 0;
	var deltaY = 0;
	
	event = $.event.fix(event || window.event);
	event.type = "mousewheel";
	
	if ( event.wheelDelta ) deltaY = event.wheelDelta / 120;
	if ( event.detail     ) deltaY = -event.detail / 3;
	
	// Horizontal scrolling support in Webkit browsers. Combination
	// of horizontal and vertical is possible, set both
	if (typeof event.originalEvent['wheelDeltaX'] !== 'undefined'
	 && typeof event.originalEvent['wheelDeltaY'] !== 'undefined') {
	    deltaY = event.originalEvent['wheelDeltaY'] / 120;
   	    deltaX = event.originalEvent['wheelDeltaX'] / 120;
	}
	// Horizontal scrolling support in Gecko browsers. Combinaison isn't
	// possible, only set variables if an horizontal scroll is detected
	else if (typeof event.originalEvent['axis'] !== 'undefined' 
	 && typeof event.originalEvent['HORIZONTAL_AXIS'] !== 'undefined' 
	 && event.originalEvent['axis'] === event.originalEvent['HORIZONTAL_AXIS'])
	{
	    deltaY = 0;
	    deltaX = -event.detail / 3;
	}
	
	// Add events and delta to the front of the arguments
	args.unshift(event, deltaX, deltaY);

	return $.event.handle.apply(this, args);
}

})(jQuery);
