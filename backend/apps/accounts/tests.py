from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


@override_settings(
    SECRET_KEY='test-secret-key-with-at-least-32-characters',
    SIMPLE_JWT={
        'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
        'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
        'SIGNING_KEY': 'test-secret-key-with-at-least-32-characters',
    },
)
class AuthApiTest(APITestCase):
    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post(
            reverse('auth-register'),
            {
                'username': 'daniel',
                'email': 'daniel@example.com',
                'first_name': 'Daniel',
                'last_name': 'Silva',
                'password': 'SenhaForte123',
                'password_confirm': 'SenhaForte123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='daniel')
        self.assertNotEqual(user.password, 'SenhaForte123')
        self.assertTrue(user.check_password('SenhaForte123'))
        self.assertNotIn('password', response.data)

    def test_login_and_refresh_return_tokens(self):
        User.objects.create_user(username='daniel', password='SenhaForte123')

        login_response = self.client.post(
            reverse('auth-login'),
            {'username': 'daniel', 'password': 'SenhaForte123'},
            format='json',
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

        refresh_response = self.client.post(
            reverse('auth-refresh'),
            {'refresh': login_response.data['refresh']},
            format='json',
        )

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_me_requires_token_and_returns_authenticated_user(self):
        user = User.objects.create_user(
            username='daniel',
            email='daniel@example.com',
            password='SenhaForte123',
        )

        unauthenticated_response = self.client.get(reverse('auth-me'))
        self.assertEqual(
            unauthenticated_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        login_response = self.client.post(
            reverse('auth-login'),
            {'username': 'daniel', 'password': 'SenhaForte123'},
            format='json',
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

        authenticated_response = self.client.get(reverse('auth-me'))

        self.assertEqual(authenticated_response.status_code, status.HTTP_200_OK)
        self.assertEqual(authenticated_response.data['id'], user.id)
        self.assertEqual(authenticated_response.data['username'], 'daniel')
