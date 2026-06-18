from django.urls import path

from apps.estimates.views import EstimateView, RegionComparisonView, WeatherView

urlpatterns = [
    path("weather/", WeatherView.as_view(), name="weather"),
    path("estimates/", EstimateView.as_view(), name="estimate"),
    path(
        "estimates/compare/", RegionComparisonView.as_view(), name="region-comparison"
    ),
]
