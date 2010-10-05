var accessLevels = {
    'BAS' : 0,
    'ESS' : 10,
    'PRE' : 20
}

var contentmapping = {
    'default' : 'iframe',
    'paperad' : 'link'
}

jQuery(document).ready(function () {    
    if (libeConfig.pageHeight) {
        jQuery('#bookPages').height(libeConfig.pageHeight);
    }
    
    jQuery('#calendarButton').val(startDate);
    jQuery('#calendarButton').bind('change', function(e) {
        var val = jQuery(this).val();
        val = val.replace(/\//gi, '-');
        location.href = libeConfig.webservices.reader_by_date.replace('{date}', val);
    });
    
    jQuery('#calendarButton').jdPicker();
    
    function readerInitCallback(data, textStatus, xhrobject) {
        try {
            var level = accessLevels[data['access_level']];
            libeConfig.changeAccessLevel(level);
            libeReader.init(publicationId);
            if (typeof extraReaderInitCallback !== 'undefined') {
                extraReaderInitCallback(data, textStatus, xhrobject, level, publicationId);
            }
        } catch (e) {

        }
    }

    jQuery.ajax({
        'url': libeConfig.webservices.token.replace('{emitter_format}', 'json'),
        'type': 'post',
        'data' : {'use_session' : 1 },
        'dataType': 'json',
        'success': readerInitCallback,
        'error': readerInitCallback
    })
});
