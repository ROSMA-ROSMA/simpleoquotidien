from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('', RedirectView.as_view(url='/api/docs/', permanent=False), name='root'),
    path('admin/', admin.site.urls), 
    

    # Endpoints Métier (Users & Commandes)
    path('Info_utilisateurs/', include('users.urls')),
    path('Commandes/', include('commandes.urls')),
    path('api/commandes/', include('commandes.urls')),   #
    path('api/utilisateurs/', include('users.urls')), 



    
    # Authentification Djoser / JWT
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),  
    # Documentation OpenAPI / Swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Gestion du stockage des fichiers uploadés (images, CNI, etc.) en mode Développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)