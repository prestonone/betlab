from django import forms
from django.contrib.admin.forms import AdminAuthenticationForm


class RememberMeAdminAuthenticationForm(AdminAuthenticationForm):
    remember_me = forms.BooleanField(
        required=False,
        initial=True,
        label="Remember me",
        widget=forms.CheckboxInput(attrs={"class": "remember-me-checkbox"}),
    )
