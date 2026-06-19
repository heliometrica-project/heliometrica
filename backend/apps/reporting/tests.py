"""
Testes do app 'reporting' — GenerationHistory e ReportExport.

Cobertura:
    - Criação de instâncias com campos obrigatórios e valores padrão
    - Representação __str__ de cada model
    - Campos com valor padrão: notes (vazio), format ('csv'), file_name (vazio)
    - Comportamento CASCADE: excluir EnergyEstimate exclui registros vinculados
    - auto_now: updated_at em GenerationHistory é atualizado ao salvar
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.core.models import Region
from apps.estimates.models import EnergyEstimate
from apps.reporting.models import GenerationHistory, ReportExport

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(username="testuser"):
    return User.objects.create_user(username=username, password="secret")


def make_region():
    return Region.objects.create(
        name="Pau dos Ferros",
        state="RN",
        latitude=Decimal("-6.108900"),
        longitude=Decimal("-38.204400"),
    )


def make_energy_estimate(user, region):
    return EnergyEstimate.objects.create(
        user=user,
        region=region,
        daily_kwh=Decimal("8.640"),
        monthly_kwh=Decimal("259.200"),
        yearly_kwh=Decimal("3110.400"),
        efficiency_index=Decimal("0.7500"),
    )


def make_generation_history(user, estimate, **kwargs):
    defaults = {"title": "Simulação Inicial", "notes": ""}
    defaults.update(kwargs)
    return GenerationHistory.objects.create(user=user, estimate=estimate, **defaults)


def make_report_export(user, estimate, **kwargs):
    defaults = {"format": ReportExport.FORMAT_CSV, "file_name": "relatorio.csv"}
    defaults.update(kwargs)
    return ReportExport.objects.create(user=user, estimate=estimate, **defaults)


# ---------------------------------------------------------------------------
# GenerationHistory
# ---------------------------------------------------------------------------

class GenerationHistoryModelTest(TestCase):
    """Testes do model GenerationHistory."""

    def setUp(self):
        self.user = make_user()
        self.region = make_region()
        self.estimate = make_energy_estimate(self.user, self.region)
        self.history = make_generation_history(self.user, self.estimate)

    def test_criacao_com_campos_obrigatorios(self):
        """GenerationHistory é criado com relacionamentos e título corretos."""
        self.assertEqual(self.history.user, self.user)
        self.assertEqual(self.history.estimate, self.estimate)
        self.assertEqual(self.history.title, "Simulação Inicial")

    def test_notes_default_vazio(self):
        """O campo notes deve ser string vazia por padrão."""
        history = make_generation_history(self.user, self.estimate, title="Sem notas")
        self.assertEqual(history.notes, "")

    def test_notes_aceita_texto_longo(self):
        """O campo notes (TextField) deve aceitar texto longo."""
        texto = "Observação importante. " * 100
        history = make_generation_history(
            self.user, self.estimate, title="Com notas", notes=texto
        )
        self.assertEqual(history.notes, texto)

    def test_str_inclui_titulo_e_usuario(self):
        """__str__ deve incluir o título e o usuário."""
        esperado = f"Simulação Inicial ({self.user})"
        self.assertEqual(str(self.history), esperado)

    def test_timestamps_preenchidos_automaticamente(self):
        """created_at e updated_at são preenchidos automaticamente."""
        self.assertIsNotNone(self.history.created_at)
        self.assertIsNotNone(self.history.updated_at)

    def test_updated_at_muda_ao_salvar(self):
        """updated_at deve ser atualizado quando o registro é salvo novamente."""
        updated_at_original = self.history.updated_at
        self.history.notes = "Nota adicionada após criação."
        self.history.save()
        self.history.refresh_from_db()
        self.assertGreaterEqual(self.history.updated_at, updated_at_original)

    def test_cascade_ao_deletar_estimativa(self):
        """Excluir a EnergyEstimate deve excluir os GenerationHistories (CASCADE)."""
        history_id = self.history.pk
        self.estimate.delete()
        self.assertFalse(GenerationHistory.objects.filter(pk=history_id).exists())

    def test_cascade_ao_deletar_usuario(self):
        """Excluir o User deve excluir os GenerationHistories vinculados (CASCADE)."""
        history_id = self.history.pk
        self.user.delete()
        self.assertFalse(GenerationHistory.objects.filter(pk=history_id).exists())


# ---------------------------------------------------------------------------
# ReportExport
# ---------------------------------------------------------------------------

class ReportExportModelTest(TestCase):
    """Testes do model ReportExport."""

    def setUp(self):
        self.user = make_user()
        self.region = make_region()
        self.estimate = make_energy_estimate(self.user, self.region)
        self.report = make_report_export(self.user, self.estimate)

    def test_criacao_com_campos_obrigatorios(self):
        """ReportExport é criado com relacionamentos e formato corretos."""
        self.assertEqual(self.report.user, self.user)
        self.assertEqual(self.report.estimate, self.estimate)
        self.assertEqual(self.report.format, ReportExport.FORMAT_CSV)
        self.assertEqual(self.report.file_name, "relatorio.csv")

    def test_format_default_e_csv(self):
        """O campo format deve ser 'csv' por padrão."""
        report = ReportExport.objects.create(user=self.user, estimate=self.estimate)
        self.assertEqual(report.format, "csv")

    def test_file_name_pode_ser_vazio(self):
        """O campo file_name aceita string vazia (blank=True)."""
        report = ReportExport.objects.create(
            user=self.user,
            estimate=self.estimate,
            file_name="",
        )
        self.assertEqual(report.file_name, "")

    def test_str_com_file_name_preenchido(self):
        """__str__ deve incluir o nome do arquivo, formato e usuário."""
        esperado = f"relatorio.csv (CSV) — {self.user}"
        self.assertEqual(str(self.report), esperado)

    def test_str_sem_file_name(self):
        """__str__ deve usar 'Relatório #pk' quando file_name está vazio."""
        report = ReportExport.objects.create(
            user=self.user,
            estimate=self.estimate,
            file_name="",
        )
        esperado = f"Relatório #{report.pk} (CSV) — {self.user}"
        self.assertEqual(str(report), esperado)

    def test_formato_pdf(self):
        """ReportExport aceita formato 'pdf'."""
        report = make_report_export(
            self.user, self.estimate,
            format=ReportExport.FORMAT_PDF,
            file_name="relatorio.pdf",
        )
        self.assertEqual(report.format, "pdf")

    def test_generated_at_preenchido_automaticamente(self):
        """generated_at é preenchido automaticamente na criação."""
        self.assertIsNotNone(self.report.generated_at)

    def test_cascade_ao_deletar_estimativa(self):
        """Excluir a EnergyEstimate exclui ReportExports vinculados (CASCADE)."""
        report_id = self.report.pk
        self.estimate.delete()
        self.assertFalse(ReportExport.objects.filter(pk=report_id).exists())

    def test_cascade_ao_deletar_usuario(self):
        """Excluir o User deve excluir os ReportExports vinculados (CASCADE)."""
        report_id = self.report.pk
        self.user.delete()
        self.assertFalse(ReportExport.objects.filter(pk=report_id).exists())


# ---------------------------------------------------------------------------
# API — GenerationHistory endpoints
# ---------------------------------------------------------------------------

class GenerationHistoryAPITest(TestCase):
    """Testes dos endpoints de CRUD de GenerationHistory."""

    def setUp(self):
        self.user = make_user()
        self.other_user = make_user(username="other")
        self.region = make_region()
        self.estimate = make_energy_estimate(self.user, self.region)
        self.other_estimate = make_energy_estimate(self.other_user, self.region)

    def _auth(self, user=None):
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken.for_user(user or self.user)
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_list_historico_retorna_apens_do_usuario(self):
        make_generation_history(self.user, self.estimate, title="Meu historico")
        make_generation_history(
            self.other_user, self.other_estimate, title="Outro historico"
        )
        response = self.client.get('/api/history/', **self._auth())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], "Meu historico")

    def test_criar_historico_com_estimativa_valida(self):
        payload = {
            'title': 'Minha simulacao',
            'estimate': self.estimate.pk,
            'notes': 'Observacao',
        }
        response = self.client.post(
            '/api/history/', payload, **self._auth(), content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['title'], 'Minha simulacao')
        self.assertEqual(data['notes'], 'Observacao')
        self.assertEqual(data['estimate'], self.estimate.pk)

    def test_criar_historico_com_estimativa_de_outro_usuario_rejeita(self):
        payload = {
            'title': 'Tentativa invasao',
            'estimate': self.other_estimate.pk,
        }
        response = self.client.post(
            '/api/history/', payload, **self._auth(), content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_criar_historico_sem_autenticacao_rejeita(self):
        payload = {
            'title': 'Sem auth',
            'estimate': self.estimate.pk,
        }
        response = self.client.post(
            '/api/history/', payload, content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_detalhar_historico(self):
        history = make_generation_history(self.user, self.estimate)
        response = self.client.get(f'/api/history/{history.pk}/', **self._auth())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], history.title)

    def test_detalhar_historico_de_outro_usuario_rejeita(self):
        history = make_generation_history(self.other_user, self.other_estimate)
        response = self.client.get(f'/api/history/{history.pk}/', **self._auth())
        self.assertEqual(response.status_code, 404)

    def test_atualizar_historico_parcial_patch(self):
        history = make_generation_history(self.user, self.estimate, title="Original")
        response = self.client.patch(
            f'/api/history/{history.pk}/',
            {'title': 'Atualizado'},
            **self._auth(),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], 'Atualizado')

    def test_atualizar_historico_total_put(self):
        history = make_generation_history(self.user, self.estimate, title="Original")
        response = self.client.put(
            f'/api/history/{history.pk}/',
            {'title': 'Total', 'estimate': self.estimate.pk, 'notes': ''},
            **self._auth(),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['title'], 'Total')

    def test_deletar_historico(self):
        history = make_generation_history(self.user, self.estimate)
        response = self.client.delete(f'/api/history/{history.pk}/', **self._auth())
        self.assertEqual(response.status_code, 204)
        self.assertFalse(GenerationHistory.objects.filter(pk=history.pk).exists())

    def test_deletar_historico_de_outro_usuario_rejeita(self):
        history = make_generation_history(self.other_user, self.other_estimate)
        response = self.client.delete(f'/api/history/{history.pk}/', **self._auth())
        self.assertEqual(response.status_code, 404)

    def test_historico_inclui_dados_da_estimativa(self):
        history = make_generation_history(self.user, self.estimate, title="Relatorio")
        response = self.client.get(f'/api/history/{history.pk}/', **self._auth())
        data = response.json()
        self.assertIn('region_name', data)
        self.assertIn('daily_kwh', data)
        self.assertIn('monthly_kwh', data)
        self.assertIn('yearly_kwh', data)
        self.assertIn('efficiency_index', data)
        self.assertEqual(data['region_name'], self.region.name)
        self.assertEqual(str(data['daily_kwh']), '8.640')
        self.assertEqual(str(data['monthly_kwh']), '259.200')
        self.assertEqual(str(data['yearly_kwh']), '3110.400')
