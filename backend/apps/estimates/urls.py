from django.urls import path

from apps.estimates.views import EstimateView, WeatherView

urlpatterns = [
    path('weather/', WeatherView.as_view(), name='weather'),
    path('estimates/', EstimateView.as_view(), name='estimate'),
]
