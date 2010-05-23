var libeConfig = function () {
    var apiRoot = "http://hanblog.info/libe/";
    
    var pageWidth = 388;
    var pageHeight = 500;
    var zoomFactor = 4;
    
    var imagesPerRow = 3;
    var imagesPerColumn = 4;
    
    var evenSideElement = document.getElementById('evenSide');
    var oddSideElement = document.getElementById('oddSide');
    
    return {
        apiRoot: apiRoot,
        pageWidth: pageWidth,
        pageHeight: pageHeight,
        zoomFactor: zoomFactor,
        imagesPerRow: imagesPerRow,
        imagesPerColumn: imagesPerColumn,
        evenSideElement: evenSideElement,
        oddSideElement: oddSideElement
    }
}()