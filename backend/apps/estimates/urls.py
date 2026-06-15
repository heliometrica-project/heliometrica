from django.urls import path

from apps.estimates.views import WeatherView

urlpatterns = [
    path('weather/', WeatherView.as_view(), name='weather'),
]
