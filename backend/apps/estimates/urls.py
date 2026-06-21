from django.urls import path

from apps.estimates.views import (
    CustomComparisonView,
    CustomEstimateView,
    EstimateView,
    RegionComparisonView,
    WeatherView,
)

urlpatterns = [
    path("weather/", WeatherView.as_view(), name="weather"),
    path("estimates/", EstimateView.as_view(), name="estimate"),
    path("estimates/custom/", CustomEstimateView.as_view(), name="custom-estimate"),
    path(
        "estimates/compare/", RegionComparisonView.as_view(), name="region-comparison"
    ),
    path(
        "estimates/compare/custom/",
        CustomComparisonView.as_view(),
        name="custom-comparison",
    ),
]
