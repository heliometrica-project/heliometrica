from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """
    App 'accounts' - autenticacao e dados do usuario autenticado.
    """

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Accounts - Autenticacao'
