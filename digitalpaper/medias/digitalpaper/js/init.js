var tokenUrl = libeConfig.webservices.token
tokenUrl = tokenUrl.replace('{emitter_format}', 'json');

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
    
    function readerInitCallback(data, textStatus, xhrobject) {
        try {
            var level = accessLevels[data['access_level']];
            libeConfig.changeAccessLevel(level);
            libeReader.init(publicationId);
        } catch (e) {
            jQuery('#hello_reader').append(' <strong>Cannot access token data! Check the host, it might be a crossdomain issue!</strong>');
        }
    }

    jQuery.ajax({
        'url': tokenUrl,
        'type': 'post',
        'data' : {'use_session' : 1 },
        'dataType': 'json',
        'success': readerInitCallback,
        'error': readerInitCallback
    })
});
