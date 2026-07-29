# from django.contrib import admin

# from . models import Category, Order, Quote

# admin.site.register(Order)
# admin.site.register(Quote)
# admin.site.register(Category)

from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from .models import Category, Order, Quote, Service


class QuoteInline(TabularInline):
    model = Quote
    extra = 0
    fields = ('status', 'price')
    tab = True


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('nom', 'description_courte', 'order_count')
    search_fields = ('nom',)

    @admin.display(description='Description')
    def description_courte(self, obj):
        return (obj.description[:60] + '…') if len(obj.description) > 60 else obj.description

    @admin.display(description='Commandes')
    def order_count(self, obj):
        return obj.orders.count()


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = (
        'id', 'client', 'category', 'status_badge',
        'localisation', 'date', 'budget',
    )
    list_filter = ('status', 'category', 'date')
    search_fields = ('description', 'localisation', 'client__username', 'client__email')
    autocomplete_fields = ('category', 'client')
    inlines = [QuoteInline]
    date_hierarchy = 'date'
    list_filter_submit = True

    fieldsets = (
        ('Informations générales', {'fields': ('client', 'category', 'status')}),
        ('Détails', {'fields': ('description', 'localisation', 'date', 'budget', 'images')}),
    )

    @admin.display(description='Statut')
    def status_badge(self, obj):
        colors = {
            'CREEE': '#6B7280',
            'EN_TRAITEMENT': '#3B82F6',
            'ASSIGNEE': '#8B5CF6',
            'ACCEPTEE': '#06B6D4',
            'REFUSEE': '#EF4444',
            'REPORTEE': '#F59E0B',
            'EN_COURS': '#F97316',
            'TERMINEE': '#10B981',
            'ANNULEE': '#DC2626',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color:{}; color:white; padding:2px 8px; '
            'border-radius:9999px; font-size:11px; font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )


@admin.register(Quote)
class QuoteAdmin(ModelAdmin):
    list_display = ('id', 'order', 'status_badge', 'price')
    list_filter = ('status',)
    search_fields = ('order__id', 'price')
    autocomplete_fields = ('order',)

    @admin.display(description='Statut')
    def status_badge(self, obj):
        colors = {'ENVOYE': '#3B82F6', 'ACCEPTE': '#10B981', 'REFUSE': '#EF4444'}
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color:{}; color:white; padding:2px 8px; '
            'border-radius:9999px; font-size:11px; font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )


@admin.register(Service)
class ServiceAdmin(ModelAdmin):
    list_display = ('id', 'prestataire', 'category', 'price', 'city', 'date_creation')
    list_filter = ('category', 'city')
    search_fields = ('prestataire__company_name', 'category__nom', 'city')
    autocomplete_fields = ('prestataire', 'category')