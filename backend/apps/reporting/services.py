import csv
import io
from datetime import datetime

from django.http import HttpResponse

from apps.estimates.models import EnergyEstimate
from apps.reporting.models import ReportExport


class ReportService:
    def generate_csv_response(
        self, estimate: EnergyEstimate, title: str = ""
    ) -> HttpResponse:
        output = io.StringIO()
        output.write('\ufeff')
        writer = csv.writer(output)

        writer.writerow([
            'Título', 'Região', 'Estado',
            'Modelo', 'Fabricante', 'Potência (Wp)', 'Quantidade',
            'Irradiação (kWh/m²/dia)', 'Temperatura (°C)', 'Cobertura (%)',
            'Diário (kWh)', 'Mensal (kWh)', 'Anual (kWh)', 'Eficiência (PR)',
        ])

        module_model = estimate.module.model if estimate.module else ''
        module_manufacturer = estimate.module.manufacturer if estimate.module else ''
        power_wp = str(estimate.module.power_wp) if estimate.module else ''
        quantity = str(estimate.module.quantity) if estimate.module else ''

        irradiation = ''
        temperature = ''
        cloud_cover = ''
        if estimate.weather_snapshot:
            irradiation = str(estimate.weather_snapshot.irradiation or '')
            temperature = str(estimate.weather_snapshot.temperature or '')
            cloud_cover = str(estimate.weather_snapshot.cloud_cover or '')

        writer.writerow([
            title,
            estimate.region.name,
            estimate.region.state,
            module_model,
            module_manufacturer,
            power_wp,
            quantity,
            irradiation,
            temperature,
            cloud_cover,
            str(estimate.daily_kwh),
            str(estimate.monthly_kwh),
            str(estimate.yearly_kwh),
            str(estimate.efficiency_index),
        ])

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'heliometrica_export_{timestamp}.csv'

        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response, filename

    def register_export(
        self, user, estimate: EnergyEstimate, filename: str
    ) -> ReportExport:
        return ReportExport.objects.create(
            user=user,
            estimate=estimate,
            format=ReportExport.FORMAT_CSV,
            file_name=filename,
        )
