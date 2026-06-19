# Exportação CSV — Relatório de Estimativa Energética

## Endpoint

```
GET /api/history/{id}/export/
```

- **Autenticação:** Obrigatória (Bearer JWT)
- **Método:** GET
- **Content-Type retornado:** `text/csv`
- **Content-Disposition:** `attachment; filename="heliometrica_export_{YYYYMMDD_HHMMSS}.csv"`

A resposta é um arquivo CSV baixável contendo os dados da estimativa vinculada ao histórico.

---

## Formato do CSV

### Cabeçalho (única linha)

```
Título,Região,Estado,Modelo,Fabricante,Potência (Wp),Quantidade,Irradiação (kWh/m²/dia),Temperatura (°C),Cobertura (%),Diário (kWh),Mensal (kWh),Anual (kWh),Eficiência (PR)
```

### Linha de dados

Uma única linha com os valores correspondentes, separados por vírgula. Exemplo:

```
Minha Simulação,Pau dos Ferros,RN,ABC-300,ABC Solar,300.00,10,5.200,28.50,45.00,12.480,374.400,4555.200,0.7500
```

---

## Campos

| Coluna | Descrição | Origem | Exemplo |
|--------|-----------|--------|---------|
| `Título` | Nome dado pelo usuário ao histórico | `GenerationHistory.title` | `Minha Simulação` |
| `Região` | Nome do município/localidade | `Region.name` | `Pau dos Ferros` |
| `Estado` | Sigla da UF | `Region.state` | `RN` |
| `Modelo` | Modelo comercial do módulo solar | `SolarModule.model` | `ABC-300` |
| `Fabricante` | Fabricante do módulo | `SolarModule.manufacturer` | `ABC Solar` |
| `Potência (Wp)` | Potência de pico do módulo em Wp | `SolarModule.power_wp` | `300.00` |
| `Quantidade` | Quantidade de módulos | `SolarModule.quantity` | `10` |
| `Irradiação (kWh/m²/dia)` | Irradiação solar global horizontal | `WeatherSnapshot.irradiation` | `5.200` |
| `Temperatura (°C)` | Temperatura média do ar | `WeatherSnapshot.temperature` | `28.50` |
| `Cobertura (%)` | Cobertura de nuvens média | `WeatherSnapshot.cloud_cover` | `45.00` |
| `Diário (kWh)` | Geração diária estimada | `EnergyEstimate.daily_kwh` | `12.480` |
| `Mensal (kWh)` | Projeção mensal (daily × 30) | `EnergyEstimate.monthly_kwh` | `374.400` |
| `Anual (kWh)` | Projeção anual (daily × 365) | `EnergyEstimate.yearly_kwh` | `4555.200` |
| `Eficiência (PR)` | Performance Ratio do sistema | `EnergyEstimate.efficiency_index` | `0.7500` |

---

## Observações

- Campos sem valor (módulo excluído, snapshot sem dado climático) são exportados como string vazia.
- O arquivo é gerado em memória e não persiste no servidor — apenas os metadados da exportação são registrados no model `ReportExport`.
- Cada requisição bem-sucedida cria um registro em `ReportExport` para rastreamento.
- O separador é vírgula (`,`) — compatível com a maioria das planilhas (Excel, Google Sheets, LibreOffice Calc).
