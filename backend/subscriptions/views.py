from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from common.api import success_response
from .models import Country
from .serializers import CountrySerializer


class CountryListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CountrySerializer

    queryset = (
        Country.objects
        .filter(is_active=True)
        .order_by("display_order", "name")
    )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return success_response(
            data=serializer.data,
            message="Countries retrieved successfully.",
        )
