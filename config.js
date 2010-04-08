var libeConfig = function () {
    var apiRoot = "http://hanblog.info/libe/resources/";
    
    var pageWidth = 388;
    var pageHeight = 500;
    var zoomFactor = 4;
    
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    
    return {
        apiRoot: apiRoot,
        pageWidth: pageWidth,
        pageHeight: pageHeight,
        zoomFactor: zoomFactor,
        evenSideElement: evenSideElement,
        oddSideElement: oddSideElement
    }
}()