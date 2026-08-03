from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, OrderViewSet, QuoteViewSet, ServiceViewSet
from django.conf import settings
from django.conf.urls.static import static


router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('orders', OrderViewSet)
router.register('quotes', QuoteViewSet, basename='quote')
router.register('services', ServiceViewSet, basename='service')

urlpatterns = router.urls
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)