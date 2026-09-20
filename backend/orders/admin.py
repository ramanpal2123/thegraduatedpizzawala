from django.contrib import admin
from .models import Table, Category, MenuItem, Order, OrderItem, ItemVariant, Feedback, Topping, Offer, AdminProfile, PendingAdminSignup


class ItemVariantInline(admin.TabularInline):
    model = ItemVariant
    extra = 3


class MenuItemAdmin(admin.ModelAdmin):
    inlines = [ItemVariantInline]
    list_display = ['name', 'category', 'price', 'is_available']


class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['order', 'rating', 'comment', 'created_at']
    list_filter = ['rating']


admin.site.register(Table)
admin.site.register(Category)
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Feedback, FeedbackAdmin)
admin.site.register(Offer)
admin.site.register(AdminProfile)
admin.site.register(PendingAdminSignup)