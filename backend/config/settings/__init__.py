import os
from decouple import config

ENVIRONMENT = config('DJANGO_ENV', default='development')

if ENVIRONMENT == 'production':
    from .production import *
else:
    from .development import *
