from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from common.api import success_response

from .models import Announcement
from .serializers import AnnouncementSerializer


class ActiveAnnouncementView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        announcement = Announcement.objects.filter(is_active=True).first()
        data = AnnouncementSerializer(announcement).data if announcement else None
        return success_response(data=data)
