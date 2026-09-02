from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, OrderViewSet, QuoteViewSet
from django.conf import settings
from django.conf.urls.static import static


router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('orders', OrderViewSet)
router.register('quotes', QuoteViewSet)

urlpatterns = router.urls
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)