from django import template

from ..copy import COPY

register = template.Library()


@register.filter
def label(obj, lang):
    """{{ activity|label:lang }} - name of an Activity or District, shop name of an Application."""
    return obj.label(lang)


@register.filter
def status_label(value, lang):
    """{{ application.status|status_label:lang }}"""
    return COPY[lang][f'status_{value}']


@register.filter
def category_label(value, lang):
    """{{ activity.category|category_label:lang }}"""
    return COPY[lang][f'category_{value}']
