import os
import filecmp
from django.core.exceptions import ValidationError
from dlms import settings

def validate_unique_filename(value):
    filepath = os.path.join(settings.MEDIA_ROOT, value.name)
    if os.path.isfile(filepath):
        raise ValidationError('Filename already exists.')

def validate_unique_file(value):
    from content_management.utils import sha256
    files = [
        os.path.join(settings.MEDIA_ROOT, "contents", filename) for filename
        in os.listdir(os.path.join(settings.MEDIA_ROOT, "contents"))
    ]
    for f in files:
        if os.path.getsize(f) == value.size:
            if sha256(open(f, "rb")) == sha256(value.file):
                raise ValidationError('File already exists with name ' + os.path.basename(f))