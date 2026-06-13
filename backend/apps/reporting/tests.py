"""
Testes do app 'reporting' — GenerationHistory e ReportExport.

Cobertura:
    - Criação de instâncias com campos obrigatórios e valores padrão
    - Representação __str__ de cada model
    - Campos com valor padrão: notes (vazio), format ('csv'), file_name (vazio)
    - Comportamento CASCADE: excluir EnergyEstimate exclui registros vinculados
    - auto_now: updated_at em GenerationHistory é atualizado ao salvar
"""

import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.core.models import Region, SolarModule
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
        history = make_generation_history(self.user, self.estimate, title="Com notas", notes=texto)
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
        """Excluir a EnergyEstimate deve excluir os ReportExports vinculados (CASCADE)."""
        report_id = self.report.pk
        self.estimate.delete()
        self.assertFalse(ReportExport.objects.filter(pk=report_id).exists())

    def test_cascade_ao_deletar_usuario(self):
        """Excluir o User deve excluir os ReportExports vinculados (CASCADE)."""
        report_id = self.report.pk
        self.user.delete()
        self.assertFalse(ReportExport.objects.filter(pk=report_id).exists())
