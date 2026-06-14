from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Region


def make_region(**kwargs):
    defaults = {
        "name": "Pau dos Ferros",
        "state": "RN",
        "latitude": Decimal("-6.108900"),
        "longitude": Decimal("-38.204400"),
    }
    defaults.update(kwargs)
    return Region.objects.create(**defaults)


class RegionAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_regioes_retorna_lista_vazia(self):
        response = self.client.get('/api/regions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_list_regioes_retorna_regioes_cadastradas(self):
        make_region()
        make_region(name="Mossoró", state="RN", latitude=Decimal("-5.187800"), longitude=Decimal("-37.344100"))

        response = self.client.get('/api/regions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_detail_regiao_por_id(self):
        region = make_region()
        response = self.client.get(f'/api/regions/{region.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['name'], 'Pau dos Ferros')
        self.assertEqual(data['state'], 'RN')
        self.assertEqual(Decimal(data['latitude']), Decimal('-6.108900'))
        self.assertEqual(Decimal(data['longitude']), Decimal('-38.204400'))

    def test_detail_regiao_inexistente_retorna_404(self):
        response = self.client.get('/api/regions/999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_busca_por_nome_filtra_regioes(self):
        make_region()
        make_region(name="Mossoró", state="RN", latitude=Decimal("-5.187800"), longitude=Decimal("-37.344100"))
        make_region(name="Natal", state="RN", latitude=Decimal("-5.794500"), longitude=Decimal("-35.211100"))

        response = self.client.get('/api/regions/?search=Mossoró')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Mossoró')

    def test_busca_por_sigla_estado_filtra_regioes(self):
        make_region()
        make_region(name="Mossoró", state="RN", latitude=Decimal("-5.187800"), longitude=Decimal("-37.344100"))
        make_region(name="Fortaleza", state="CE", latitude=Decimal("-3.717200"), longitude=Decimal("-38.543300"))

        response = self.client.get('/api/regions/?search=CE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['state'], 'CE')

    def test_campos_retornados_no_list(self):
        make_region()
        response = self.client.get('/api/regions/')
        data = response.json()
        regiao = data[0]
        self.assertIn('id', regiao)
        self.assertIn('name', regiao)
        self.assertIn('state', regiao)
        self.assertIn('latitude', regiao)
        self.assertIn('longitude', regiao)

    def test_campos_retornados_no_detail(self):
        region = make_region()
        response = self.client.get(f'/api/regions/{region.pk}/')
        data = response.json()
        self.assertIn('id', data)
        self.assertIn('name', data)
        self.assertIn('state', data)
        self.assertIn('latitude', data)
        self.assertIn('longitude', data)

    def test_list_endpoint_metodo_post_nao_permitido(self):
        response = self.client.post('/api/regions/', {'name': 'Teste'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_detail_endpoint_metodo_post_nao_permitido(self):
        region = make_region()
        response = self.client.post(f'/api/regions/{region.pk}/', {'name': 'Teste'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_list_endpoint_metodo_delete_nao_permitido(self):
        response = self.client.delete('/api/regions/1/')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_busca_parcial_por_nome_funciona(self):
        make_region(name="Pau dos Ferros")
        make_region(name="Major Sales")
        make_region(name="Mossoró")

        response = self.client.get('/api/regions/?search=Pau')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Pau dos Ferros')
