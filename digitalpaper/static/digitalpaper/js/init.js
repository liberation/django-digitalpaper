var accessLevels = {
    'BAS' : 0,
    'ESS' : 10,
    'PRE' : 20
}; // FIXME: those level names shouldn't exist, shouldn't be hardcoded in the app

var contentmapping = {
    'default' : 'iframe',
    'paperad' : 'link'
};

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

    jQuery('#calendarButton').jdPicker({
        'date_max' : lastDate,
        'date_min' : firstDate
    });
    
    function readerInitCallback(data, textStatus, xhrobject) {
        try {
            var level = accessLevels[data['access_level']];
            libeConfig.changeAuthStatus(data['authenticated']);
            libeConfig.changeAccessLevel(level);
            libeReader.init(publicationId);
        } catch (e) {

        }
    }

    jQuery.ajax({
        'url': libeConfig.webservices.token.replace('{format}', 'json'),
        'type': 'post',
        'data' : {'use_session' : 1 },
        'dataType': 'json',
        'success': readerInitCallback,
        'error': readerInitCallback
    });
});
