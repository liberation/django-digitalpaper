var libeConfig = function () {
    var apiRoot = "http://hanblog.info/libe/resources/";
    
    var pageWidth = 388;
    var pageHeight = 500;
        
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    
    return {
        apiRoot: apiRoot,
        pageWidth: pageWidth,
        pageHeight: pageHeight,
        evenSideElement: evenSideElement,
        oddSideElement: oddSideElement
    }
}()