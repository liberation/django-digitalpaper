# -*- coding: utf-8 -*-
import math
import mimetypes
import os
import os.path
import stat
import subprocess
import time
import unicodedata
from urllib import quote, quote_plus

from django.http import HttpResponse
from django.conf import settings
from django.db.models import loading
from django.core.urlresolvers import get_resolver

from digitalpaper.constants import (ACCEPTED_THUMB_SIZE, PAPERPAGE_IMAGE_HEIGHT,
                                    PAPERPAGE_CROP_IMAGES_PER_COLUMN,
                                    PAPERPAGE_CROP_IMAGES_PER_ROW)


def get_publication_date_field():
    return settings.READER_PUBLICATION_DATE_FIELD


def get_model_for_publication():
    return loading.get_model(settings.READER_PUBLICATION_APP_NAME, settings.READER_PUBLICATION_MODEL_NAME)


def get_model_for_paperpage():
    return loading.get_model(settings.READER_PAPERPAGE_APP_NAME, settings.READER_PAPERPAGE_MODEL_NAME)


def get_manager_for_publication(inst):
    name = getattr(settings, 'READER_PUBLICATION_MANAGER_NAME', 'objects')
    manager = getattr(get_model_for_publication(), name)
    return manager


def get_manager_method_for_publication_by_date(inst):
    manager = get_manager_for_publication(inst)
    method = getattr(manager, settings.READER_PUBLICATION_MANAGER_METHOD_BYDATE_NAME)
    return method


def build_parameters(*args, **kwargs):
    '''
    Utility function to build a list of parameters for an URI template
    args are used to build parameters without values like this: a={a}&b={b}...
    kwargs are used to build parameters with values like this: a=42&b=56&...
    '''
    def _urlencode_custom(d):
        rval = []
        for k, v in d.items():
            k = quote_plus(str(k))
            v = quote_plus(str(v), safe='{}')  # To allow {} in uri templates without escaping
            rval.append('%s=%s' % (k, v))
        return "&".join(rval)

    d = dict(zip(args, ['{%s}' % (str(a), ) for a in args]))
    d.update(kwargs)
    return _urlencode_custom(d)


def get_uris_templates_for_settings(urlnames, prefix=""):
    '''
    Utility function to return a dict mapping urlnames to URI Templates
    See get_uri_template() for how it works
    '''
    rval = {}
    for urlname in urlnames:
        rval[urlname.split(':')[-1]] = get_uri_template(urlname, prefix=prefix)
    return rval


def get_uris_templates_for_settings_with_params(urlnamesandargs, prefix=""):
    '''
    Utility function to return a dict mapping urlnames to URI Templates,
    adding specific GET params to each one.
    See get_uri_template() for how it works
    '''
    rval = {}
    for urlname, args in urlnamesandargs:
        rval[urlname.split(':')[-1]] = get_uri_template(urlname, prefix=prefix) + '?' + build_parameters(*args)
    return rval


def get_uri_template(urlname, args=None, prefix=""):
    '''
    Utility function to return an URI Template from a named URL in django
    Copy from piston doc.py, added namespacing support and removing args
    checks.

    Restrictions:
    - Only supports named urls! i.e. url(... name="toto")
    - Only support one namespace level
    - Only returns the first URL possibility. Don't re-use the same urlname multiple times!
    - Supports multiple pattern possibilities (i.e., patterns with non-capturing parenthesis in them)
      by trying to find a pattern whose optional parameters match those you specified
      (a parameter is considered optional if it doesn't appear in every pattern possibility)
    '''
    def _convert(template, args=None):
        """URI template converter"""
        if not args:
            args = []
        paths = template % dict([p, "{%s}" % p] for p in args)
        return u'%s/%s' % (prefix, paths)

    resolver = get_resolver(None)
    parts = urlname.split(':')
    if len(parts) > 1 and resolver.namespace_dict.has_key(parts[0]):
        namespace = parts[0]
        urlname = parts[1]
        nprefix, resolver = resolver.namespace_dict[namespace]
        prefix = prefix + '/' + nprefix.rstrip('/')
    possibilities = resolver.reverse_dict.getlist(urlname)
    for tmp in possibilities:
        possibility, pattern = tmp[:2]
        if not args:
            # If not args are specified, we only consider the first pattern
            # django gives us
            result, params = possibility[0]
            return _convert(result, params)
        else:
            # If there are optionnal arguments passed, use them to try to find
            # the correct pattern.
            # First, we need to build a list with all the arguments
            seen_params = []
            for result, params in possibility:
                seen_params.append(params)
            # Then build a set to find the common ones, and use it to build the
            # list of all the expected params
            common_params = reduce(lambda x, y: set(x) & set(y), seen_params)
            expected_params = sorted(common_params.union(args))
            # Then finally, loop again over the pattern possibilities and return
            # the first one that strictly match expected params
            for result, params in possibility:
                if sorted(params) == expected_params:
                    return _convert(result, params)
    return None


class HttpResponseXFile(HttpResponse):
    def __init__(self, filename, *args, **kwargs):
        attachment_filename = kwargs.pop('attachment_filename', None)

        if settings.DEBUG:
            # In debug mode, we read the file like mod_xsendfile would do, so that
            # this class can work without the mod_xsendfile module
            kwargs['content'] = open(filename, 'rb').read()

        super(HttpResponseXFile, self).__init__(*args, **kwargs)
        self['X-Sendfile'] = quote(filename.encode('utf8'))
        self['Content-Type'] = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        # Content-encoding is here to make sure gzip middleware is not triggered.
        # It should not be sent back to the user, mod_xsendfile will intercept it
        # and remove it.
        self['Content-Encoding'] = 'x-send-file'

        if not settings.DEBUG and attachment_filename:
            attachment_filename = unicodedata.normalize('NFKD', unicode(attachment_filename)).encode('ascii', 'ignore')
            # In production, sent the file as attachement if attachment_filename is set
            self['Content-Disposition'] = 'attachment; filename="%s"' % (attachment_filename, )


class FileLock(object):
    """Represents a file lock on disk, the object may or may not
    own the lock. If it doesn't own the lock it can not delete it"""

    LOCK_EXPIRY_DELAY = 5 * 60
    LOCK_TIMEOUT = 5

    def __init__(self, path):
        self.lockname = path + '.lock'

    def acquire_lock(self):
        """
        Try to acquire a lock on file. If the lock is 5min old it raise an Exception.
        """
        try:
            fd = os.open(self.lockname,
                         os.O_WRONLY | os.O_EXCL | os.O_CREAT)
            os.close(fd)
            return True
        except OSError:
            stats = os.stat(self.lockname)
            access_time = stats[stat.ST_ATIME]
            if time.time() - access_time > FileLock.LOCK_EXPIRY_DELAY:  # the lock is 5min old
                os.remove(self.lockname)
                raise Exception('Found an old lock %s, last popen call failed.' % self.lockname)
            return False

    def release_lock(self):
        """
        Release a lock around this file
        """
        try:
            os.unlink(self.lockname)
        except OSError:
            pass

    def is_locked(self):
        """
        Check if file is locked
        """
        return os.path.exists(self.lockname)


def open_pdf(filename, password=None):
    """
    Open a PDF with PdfFileReader and return it.
    If the PDF seems encrypted, try to decrypt with the given password.
    Some PDFs are encrypted with a default empty password, so we try with this
    if no password is given
    """
    from pyPdf import PdfFileReader
    from pyPdf.utils import PdfReadError
    pdf = PdfFileReader(file(filename, "rb"))
    if pdf.isEncrypted:
        if not pdf.decrypt('' if password is None else password):
            raise PdfReadError('Unable to decrypt pdf %s' % filename)
    return pdf


class PaperPageThumbnail(object):
    P_ERROR_BAD = 1
    P_ERROR_OS = 2
    P_SUCCESS = 3

    def __init__(self, paperpage, field="original_file", pdf_password=None):
        self._infos_loaded = False
        self.paperpage = paperpage
        self.file_field = getattr(paperpage, field)
        self.pdf_password = pdf_password

    def _load_pdf_infos(self):
        if self._infos_loaded:
            return

        # Read the pdf to find the correct ratio to use
        pdf = open_pdf(self.file_field.path, self.pdf_password)
        box = pdf.getPage(0).cropBox
        topleft = box.getUpperLeft()
        bottomright = box.getLowerRight()
        self.width = round(abs(topleft[0] - bottomright[0]))
        self.height = round(abs(topleft[1] - bottomright[1]))
        self.width = int(round(self.width * PAPERPAGE_IMAGE_HEIGHT / self.height))
        self.resolution = 72.0 * PAPERPAGE_IMAGE_HEIGHT / self.height
        self.height = PAPERPAGE_IMAGE_HEIGHT
        self._infos_loaded = True

    def _get_paths(self, size=None, format=None):
        filename = self.file_field.name.replace('.pdf', '_%s.%s' % (size, format))
        filename = os.path.join(settings.MEDIA_ROOT, 'cache', filename)

        dirname = os.path.dirname(filename)
        if not os.path.exists(dirname):
            # Create directory structure if necessary
            os.makedirs(dirname)

        return self.file_field.path, filename

    def _subprocess_action(self, args=None, filename=None):
        # TODO: analyse and rewrote this function, see why in comments below
        lock = FileLock(filename)
        if lock.acquire_lock():
            try:
                pp = subprocess.Popen(args, stdout=subprocess.PIPE)
                #output = pp.stdout.read()
                pp.wait()
            except OSError:
                try:
                    os.remove(filename)
                finally:
                    lock.release_lock()
                # The message of this exception is strange, because having an
                # OSError on the subprocess is not linked to the lock !!!!
                raise Exception('Found an old lock')
            else:
                # Being here does not guarantee use that the command was
                # successfully done. We should test the existence of the
                # generated filename, as it's done in the main "else" block
                lock.release_lock()
                #print output
                return PaperPageThumbnail.P_SUCCESS, filename

        else:  # another thread is already working on the file, we wait for it
            t = time.time()
            while lock.is_locked():
                time.sleep(0.1)
                if time.time() - t > FileLock.LOCK_TIMEOUT:  # don't wait more than LOCK_TIMEOUT seconds
                    raise Exception('Waiting for thumbnail generation, but it took way too long')

            if os.path.exists(filename):
                return PaperPageThumbnail.P_SUCCESS, filename
            else:
                raise Exception('File `%s` does not exist, but it should' % filename)

    def _generate_big_image_from_pdf(self, force_resolution=None):
        pdf_filename, img_filename = self._get_paths(size=PAPERPAGE_IMAGE_HEIGHT, format='png')

        if self.check_file_freshness(pdf_filename, img_filename):
            return PaperPageThumbnail.P_SUCCESS, img_filename

        # pyPDF raise when opening some bad constructed PDFs, so instead of not
        # having any image at all, simply tell gs about the wanted resolution
        size_arg = None
        try:
            self._load_pdf_infos()
            if not force_resolution:
                size_arg = '-g%sx%s' % (self.width, self.height)
        except (TypeError,        # bad xfer resulting in "TypeError 'NumberObject' object has no attribute '__getitem__'"
                AssertionError,   # no xfer resulting in "raise False" in pyPDF if no xfer
                ValueError):      # bad xfer can also result in "ValueError invalid literal for int() with base 10: 'f'"
            if not force_resolution:
                self.resolution = 72.0
                size_arg = '-dDEVICEHEIGHT=%s' % PAPERPAGE_IMAGE_HEIGHT  # may not be used
                                                                         # without width
        args = ['gs',
                '-dBATCH',
                '-dNOPAUSE',
                '-sDEVICE=png16m',
                '-dTextAlphaBits=4',
                '-sOutputFile=%s' % img_filename,
                '-r%s' % (force_resolution or self.resolution),
                pdf_filename
        ]
        if size_arg:
            args.append(size_arg)
        return self._subprocess_action(args=args, filename=img_filename)

    def check_file_freshness(self, pdf_filename, image_filename):
        if os.path.exists(image_filename):
            if os.stat(image_filename)[stat.ST_MTIME] > os.stat(pdf_filename)[stat.ST_MTIME]:
                # File already exists and is up-to-date!
                return True
        return False

    @classmethod
    def validate_size(cls, size):
        if size not in ACCEPTED_THUMB_SIZE:
            return False
        return True

    def generate_thumbnail(self, size):
        if not self.validate_size(size):
            return PaperPageThumbnail.P_ERROR_BAD, 'Bad size specified: %s' % (str(size), )

        pdf_filename, thumb_filename = self._get_paths(size=size, format='jpg')
        rval, detail = self._generate_big_image_from_pdf()
        if rval != PaperPageThumbnail.P_SUCCESS:
            return rval, detail
        else:
            big_filename = detail

        if self.check_file_freshness(pdf_filename, thumb_filename):
            return PaperPageThumbnail.P_SUCCESS, thumb_filename

        args = ('convert',
                '-resize',
                '%s' % size,
                '-antialias',
                '-colorspace', 'rgb',
                '-quality', '90',
                big_filename,
                thumb_filename
        )
        return self._subprocess_action(args=args, filename=thumb_filename)

    def crop(self, x, y):
        import Image
        x = int(x)
        if x >= PAPERPAGE_CROP_IMAGES_PER_ROW:
            # The js is sending us coordinates starting from the page on the
            # left, so we need to adjust them to the current page only.
            x = x - PAPERPAGE_CROP_IMAGES_PER_ROW
        y = int(y)

        pdf_filename, img_filename = self._get_paths(size=PAPERPAGE_IMAGE_HEIGHT, format='png')
        rval, detail = self._generate_big_image_from_pdf()
        if rval != PaperPageThumbnail.P_SUCCESS:
            return rval, detail
        else:
            img_filename = detail

        # ImageMagick will automatically generate a file named like name-0.ext, name-1.ext, etc.
        # We need that name.
        ord_img = y * PAPERPAGE_CROP_IMAGES_PER_ROW + x
        cropped_filename = img_filename.replace('.png', '-%d.png' % (ord_img, ))

        if self.check_file_freshness(pdf_filename, cropped_filename):
            return PaperPageThumbnail.P_SUCCESS, cropped_filename

        size = Image.open(open(img_filename)).size
        width = math.ceil(float(size[0]) / PAPERPAGE_CROP_IMAGES_PER_COLUMN)
        height = math.ceil(float(size[1]) / PAPERPAGE_CROP_IMAGES_PER_ROW)

        args = ('convert',
                img_filename,
                '-colorspace', 'rgb',
                '-crop', '%dx%d' % (width, height),
                img_filename
        )
        return self._subprocess_action(args=args, filename=cropped_filename)


def split_multipage_pdf(filename, destination=None, pdf_password=None):
    """
    Split a PDF with many pages into many PDFs, one per page.
    `filename` is the absolute path of the pdf to split.
    New PDFs will be saved in the desination path provided, or in the same
    directory as the original. "-%03d" is added to new PDFs before the extension.
    This function returns a list of the absolute file names of the new PDFs.
    If no PDF was generated, the returned list is empty.
    This method DO NOT manage any exception raised by pyPdf
    """
    from pyPdf import PdfFileWriter

    if not destination:
        destination = os.path.dirname(filename)

    basename = os.path.splitext(os.path.basename(filename))[0]

    input_pdf = open_pdf(filename, pdf_password)
    if input_pdf.numPages < 2:
        return []

    output_names = []
    for num, page in enumerate(input_pdf.pages):
        output_name = os.path.join(destination, '%s-%03d.pdf' % (basename, num + 1))

        output_pdf = PdfFileWriter()
        output_pdf.addPage(page)

        output_stream = file(output_name, "wb")
        output_pdf.write(output_stream)
        output_stream.close()

        output_names.append(output_name)

    return output_names
