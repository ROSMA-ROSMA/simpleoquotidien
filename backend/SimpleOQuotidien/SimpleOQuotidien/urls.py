from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from users.views import CustomActivationView, LogoutView
from commandes.views import DirectQuoteActionView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoints Métier (Users & Commandes)
    path('Info_utilisateurs/', include('users.urls')),
    path('Commandes/', include('commandes.urls')),
    path('Notifications/', include('notifications.urls')),
    path('auth/jwt/logout/', LogoutView.as_view(), name='jwt-logout'),
    path('api/auth/users/activation/', CustomActivationView.as_view(), name='custom-activation'),
    
    # Authentification Djoser / JWT
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    
    # Documentation OpenAPI / Swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    path(
        'quote-action/<str:token>/',
        DirectQuoteActionView.as_view(),
        name='direct-quote-action',
    ),
]

# Fichiers media (images uploadées) — toujours servir, y compris en production
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)