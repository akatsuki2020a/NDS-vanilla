from .copy import COPY, lang_code


def copy(request):
    """Puts the current language's copy, the language code and the text direction in every template."""
    lang = lang_code()
    return {'copy': COPY[lang], 'lang': lang, 'dir': 'rtl' if lang == 'ar' else 'ltr'}
