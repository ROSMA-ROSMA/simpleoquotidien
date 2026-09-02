from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import action, display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import Assignment, Notes, PrestataireProfile, Subscription, Utilisateur


# --- INLINES (AFFICHER LES INFORMATIONS ASSOCIÉES AU PRESTATAIRE) ---

class SubscriptionInline(TabularInline):
    model = Subscription
    fk_name = 'prestataire'
    extra = 0
    fields = ('plan', 'statut', 'mode_payment', 'date_creation')
    readonly_fields = ('date_creation',)
    tab = True


class NotesInline(TabularInline):
    model = Notes
    fk_name = 'prestataire'
    extra = 0
    fields = ('etoile', 'commentaire', 'author', 'date_creation')
    readonly_fields = ('date_creation',)
    autocomplete_fields = ('author',)
    tab = True


class AssignmentInline(TabularInline):
    model = Assignment
    fk_name = 'prestataire'
    extra = 0
    fields = ('order', 'methode', 'qualifier', 'date_creation')
    readonly_fields = ('date_creation',)
    autocomplete_fields = ('qualifier',)
    tab = True


# --- ADMIN UTILISATEUR ---

@admin.register(Utilisateur)
class UtilisateurAdmin(DjangoUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    model = Utilisateur
    list_display = ('email', 'username', 'first_name', 'last_name', 'role_badge', 'pays', 'is_active', 'is_staff')
    list_filter = ('role', 'pays', 'is_active', 'is_staff')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    list_filter_submit = True

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Informations personnelles'), {'fields': ('first_name', 'last_name', 'pays', 'role')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Dates importantes'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role', 'pays'),
        }),
    )

    @display(
        description=_("Rôle"),
        label={
            "CLIENT": "info",
            "PRESTATAIRE": "warning",
            "AGENT": "secondary",
            "ADMIN": "success",
        }
    )
    def role_badge(self, obj):
        return obj.role


# --- ADMIN PRESTATAIRE PROFILE ---

@admin.register(PrestataireProfile)
class PrestataireProfileAdmin(ModelAdmin):
    list_display = (
        'company_name', 'get_user_email', 'verification_status_badge',
        'get_user_pays', 'langue', 'date_creation', 'date_modification',
    )
    list_filter = ('verification_status', 'langue', 'user__pays')
    search_fields = ('company_name', 'user__email', 'user__first_name', 'user__last_name', 'services', 'zones_couvertes')
    readonly_fields = ('date_creation', 'date_modification')
    autocomplete_fields = ('user',)
    inlines = [AssignmentInline, SubscriptionInline, NotesInline]
    list_filter_submit = True
    actions = ['approuver_prestataires', 'suspendre_prestataires']

    fieldsets = (
        (_('Compte Utilisateur Associé'), {'fields': ('user',)}),
        (_('Entreprise'), {'fields': ('company_name', 'services', 'zones_couvertes', 'langue', 'tarif')}),
        (_('Vérification & Documents'), {'fields': ('verification_status', 'cni_passeport', 'justificatif', 'photo')}),
        (_('Dates'), {'fields': ('date_creation', 'date_modification')}),
    )

    # Utilisation des badges natifs Django Unfold
    @display(
        description=_("Statut Vérification"),
        label={
            "EN_ATTENTE": "warning",
            "VALIDE": "success",
            "SUSPENDU": "danger",
        }
    )
    def verification_status_badge(self, obj):
        return obj.verification_status

    @admin.display(description=_('Email Utilisateur'), ordering='user__email')
    def get_user_email(self, obj):
        return obj.user.email

    @admin.display(description=_('Pays'), ordering='user__pays')
    def get_user_pays(self, obj):
        return obj.user.pays

    # Actions d'administration Unfold pour valider/suspendre rapidement
    @action(description=_("Valider les prestataires sélectionnés"))
    def approuver_prestataires(self, request, queryset):
        queryset.update(verification_status='VALIDE')

    @action(description=_("Suspendre les prestataires sélectionnés"))
    def suspendre_prestataires(self, request, queryset):
        queryset.update(verification_status='SUSPENDU')


# --- AUTRES ADMINISTRATION DE MODÈLES ---

@admin.register(Assignment)
class AssignmentAdmin(ModelAdmin):
    list_display = ('id', 'order', 'prestataire', 'qualifier', 'methode', 'date_creation')
    list_filter = ('methode',)
    search_fields = ('order__id', 'prestataire__company_name', 'qualifier__email')
    autocomplete_fields = ('prestataire', 'qualifier')


@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin):
    list_display = ('prestataire', 'plan', 'statut', 'mode_payment', 'date_creation')
    list_filter = ('statut', 'mode_payment')
    search_fields = ('prestataire__company_name', 'prestataire__user__email')
    autocomplete_fields = ('prestataire',)


@admin.register(Notes)
class NotesAdmin(ModelAdmin):
    list_display = ('prestataire', 'author', 'etoile', 'commentaire_court', 'date_creation')
    list_filter = ('etoile',)
    search_fields = ('prestataire__company_name', 'author__email', 'commentaire')
    autocomplete_fields = ('prestataire', 'author')

    @admin.display(description=_('Commentaire'))
    def commentaire_court(self, obj):
        return (obj.commentaire[:50] + '…') if len(obj.commentaire) > 50 else obj.commentaire