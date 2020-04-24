from django.urls import include, path
from rest_framework import routers
from django.conf.urls.static import static

from dlms import settings
from .views import (
    ContentViewSet, MetadataViewSet, MetadataTypeViewSet, ContentSheetView,
    LibraryFolderViewSet, LibraryVersionViewSet, LibLayoutImageViewSet, LibraryBuildView)

router = routers.DefaultRouter()
router.register(r'contents', ContentViewSet)
router.register(r'metadata', MetadataViewSet)
router.register(r'metadata_types', MetadataTypeViewSet)
router.register(r'lib_layout_images', LibLayoutImageViewSet)
router.register(r'library_versions', LibraryVersionViewSet)
router.register(r'library_folders', LibraryFolderViewSet)


urlpatterns = [
    path('api/', include(router.urls)),
    path('api/contents_upload/', ContentSheetView.as_view(), name="contents-upload"),
    path('api/create_build/<int:version_id>/', LibraryBuildView.as_view(), name="create-build"),
    ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)