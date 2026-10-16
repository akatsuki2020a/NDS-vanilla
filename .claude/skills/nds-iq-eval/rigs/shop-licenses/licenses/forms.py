import re
from datetime import timedelta
from pathlib import Path

from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone

from .copy import COPY, lang_code, t
from .models import Activity, Application, District, Status

MAX_FILE_BYTES = 5 * 1024 * 1024
# file kind -> first bytes; the extension and the bytes must agree
MAGIC = {'pdf': b'%PDF', 'png': b'\x89PNG', 'jpg': b'\xff\xd8'}


def check_file(f, kinds, type_key, size_key):
    """Raise the COPY message when the file is too big, or is not one of `kinds`."""
    if f.size > MAX_FILE_BYTES:
        raise ValidationError(t(size_key))
    kind = Path(f.name).suffix.lower().lstrip('.').replace('jpeg', 'jpg')
    head = f.read(4)
    f.seek(0)
    if kind not in kinds or not head.startswith(MAGIC[kind]):
        raise ValidationError(t(type_key))
    return f


class ApplicationForm(forms.ModelForm):
    declaration = forms.BooleanField(required=True)

    class Meta:
        model = Application
        fields = [
            'shop_name_ar', 'shop_name_en', 'activity', 'cr_number', 'district', 'area_m2',
            'opening_date', 'floor_plan', 'lease_contract', 'phone',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = lang_code()
        for name, field in self.fields.items():
            field.label = COPY[lang][f'label_{name}']
            if f'help_{name}' in COPY[lang]:
                field.help_text = COPY[lang][f'help_{name}']
        # Django's own max_length message is replaced by ours (same text as the clean_* checks)
        for name, key in [('shop_name_ar', 'err_shop_name_ar_length'), ('shop_name_en', 'err_shop_name_en_length'),
                          ('cr_number', 'err_cr_number'), ('phone', 'err_phone')]:
            self.fields[name].error_messages['max_length'] = t(key)
        self.fields['declaration'].error_messages['required'] = t('err_declaration')
        self.fields['activity'].queryset = Activity.objects.all()
        self.fields['activity'].label_from_instance = lambda a: a.label(lang)
        self.fields['activity'].empty_label = COPY[lang]['form_select_placeholder']
        self.fields['district'].queryset = District.objects.all()
        self.fields['district'].label_from_instance = lambda d: d.label(lang)
        self.fields['district'].empty_label = COPY[lang]['form_select_placeholder']

    def clean_shop_name_ar(self):
        value = self.cleaned_data['shop_name_ar'].strip()
        if not 3 <= len(value) <= 60:
            raise ValidationError(t('err_shop_name_ar_length'))
        if not re.search('[ء-ي]', value):
            raise ValidationError(t('err_shop_name_ar_arabic'))
        return value

    def clean_shop_name_en(self):
        value = self.cleaned_data['shop_name_en'].strip()
        if not value:
            return ''
        if not 3 <= len(value) <= 60:
            raise ValidationError(t('err_shop_name_en_length'))
        if not re.fullmatch(r"[A-Za-z0-9 &'.\-]+", value):
            raise ValidationError(t('err_shop_name_en_chars'))
        return value

    def clean_cr_number(self):
        value = self.cleaned_data['cr_number'].strip()
        if not re.fullmatch(r'7\d{9}', value):
            raise ValidationError(t('err_cr_number'))
        return value

    def clean_area_m2(self):
        value = self.cleaned_data['area_m2']
        if not 10 <= value <= 2000:
            raise ValidationError(t('err_area_range'))
        return value

    def clean_opening_date(self):
        value = self.cleaned_data['opening_date']
        if value < timezone.localdate() + timedelta(days=14):
            raise ValidationError(t('err_opening_date'))
        return value

    def clean_floor_plan(self):
        return check_file(self.cleaned_data['floor_plan'], ('pdf', 'png', 'jpg'),
                          'err_floor_plan_type', 'err_floor_plan_size')

    def clean_lease_contract(self):
        return check_file(self.cleaned_data['lease_contract'], ('pdf',),
                          'err_lease_type', 'err_lease_size')

    def clean_phone(self):
        value = self.cleaned_data['phone'].strip()
        if not re.fullmatch(r'05\d{8}', value):
            raise ValidationError(t('err_phone'))
        return value

    def clean(self):
        data = super().clean()
        activity, area = data.get('activity'), data.get('area_m2')
        if activity and area is not None and activity.needs_health_certificate and area < 20:
            self.add_error('area_m2', t('err_health_area'))
        return data


class DecisionForm(forms.Form):
    status_field = 'decision'  # the field that holds the chosen status
    decision = forms.ChoiceField()
    inspection_date = forms.DateTimeField(required=False)
    note = forms.CharField(required=False, max_length=300, widget=forms.Textarea)

    DECISIONS = [Status.UNDER_REVIEW, Status.INSPECTION_SCHEDULED, Status.APPROVED, Status.REJECTED]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        lang = lang_code()
        self.fields['decision'].choices = [(s.value, COPY[lang][f'decision_{s.value}']) for s in self.DECISIONS]
        self.fields['decision'].label = COPY[lang]['review_decision']
        self.fields['inspection_date'].label = COPY[lang]['review_inspection_date']
        self.fields['note'].label = COPY[lang]['review_note']
        self.fields['note'].help_text = COPY[lang]['review_note_help']
        self.fields['note'].error_messages['max_length'] = t('err_note_length')

    def allowed(self, status):
        return True

    def clean(self):
        data = super().clean()
        decision = data.get(self.status_field)
        if not decision:
            return data
        if not self.allowed(decision):
            self.add_error(self.status_field, t('err_move_not_allowed'))
            return data
        if decision == Status.INSPECTION_SCHEDULED:
            when = data.get('inspection_date')
            if not when and 'inspection_date' not in self.errors:
                self.add_error('inspection_date', t('err_inspection_required'))
            elif when and when <= timezone.now():
                self.add_error('inspection_date', t('err_inspection_future'))
        if decision == Status.REJECTED and not data.get('note') and 'note' not in self.errors:
            self.add_error('note', t('err_note_required'))
        return data


# status -> statuses a board card may move to
MOVES = {
    Status.SUBMITTED: [Status.UNDER_REVIEW],
    Status.UNDER_REVIEW: [Status.INSPECTION_SCHEDULED, Status.REJECTED],
    Status.INSPECTION_SCHEDULED: [Status.APPROVED, Status.REJECTED],
}


class MoveForm(DecisionForm):
    """Moving a board card: DecisionForm with the status in `to`, limited to MOVES."""
    status_field = 'to'
    field_order = ['to', 'inspection_date', 'note']
    to = forms.ChoiceField(choices=Status.choices)

    def __init__(self, *args, application, **kwargs):
        super().__init__(*args, **kwargs)
        self.application = application
        del self.fields['decision']
        lang = lang_code()
        self.fields['to'].choices = [(s.value, COPY[lang][f'status_{s.value}']) for s in Status]
        self.fields['to'].label = COPY[lang]['move_to']
        self.fields['inspection_date'].label = COPY[lang]['move_inspection_date']
        self.fields['note'].label = COPY[lang]['move_note']
        self.fields['note'].help_text = COPY[lang]['move_note_help']

    def allowed(self, status):
        return status in MOVES.get(self.application.status, [])
