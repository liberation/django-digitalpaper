PAPERPAGE_IMAGE_HEIGHT = 2000  # Height used for 'big' paperpage preview (zoomed)
PAPERPAGE_IMAGE_PREVIEW_HEIGHT = 500  # Height used for 'normal' paperpage preview
PAPERPAGE_IMAGE_MEDIUM_HEIGHT = 250  # Height used for 'medium' paperpage preview (miniatures of books)
PAPERPAGE_IMAGE_SMALL_HEIGHT = 148  # Height used for 'small' paperpage preview (miniatures)
PAPERPAGE_IMAGE_EXTRASMALL_HEIGHT = 50  # Height used for 'extra small' paperpage preview (small miniatures)
ACCEPTED_THUMB_SIZE = ('x%s' % PAPERPAGE_IMAGE_EXTRASMALL_HEIGHT,
                       'x%s' % PAPERPAGE_IMAGE_SMALL_HEIGHT,
                       'x%s' % PAPERPAGE_IMAGE_MEDIUM_HEIGHT,
                       'x%s' % PAPERPAGE_IMAGE_PREVIEW_HEIGHT)  # Accepted thumbnails size (imagemagick format, we specify the height, so there is an "x" prefix)
PAPERPAGE_CROP_IMAGES_PER_COLUMN = 4  # Number of columns when generating multiple images for zoomed paperpages
PAPERPAGE_CROP_IMAGES_PER_ROW = 4  # Number of rows when generating multiple images for zoomed paperpages
PAPERPAGE_CROPPED_ZOOM_FACTOR = PAPERPAGE_IMAGE_HEIGHT / 500  # Zoom factor
