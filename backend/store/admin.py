from django.contrib import admin
from .models import Category, Supplier, Product, Customer, Inventory, Sale, SaleItem, StockMovement

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_person', 'email', 'phone', 'is_active')
    search_fields = ('company_name', 'contact_person', 'email')
    list_filter = ('is_active',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'selling_price', 'current_stock', 'is_active')
    search_fields = ('name', 'sku', 'barcode')
    list_filter = ('category', 'supplier', 'is_active')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'is_active')
    search_fields = ('full_name', 'email', 'phone')
    list_filter = ('is_active',)

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'last_updated', 'is_active')
    search_fields = ('product__name',)
    list_filter = ('is_active',)

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'total_amount', 'payment_method', 'sale_date', 'is_active')
    search_fields = ('customer__full_name', 'customer__email')
    list_filter = ('payment_method', 'sale_date', 'is_active')
    inlines = [SaleItemInline]
    readonly_fields = ('sale_date', 'created_at', 'updated_at')

@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ('sale', 'product', 'quantity', 'unit_price', 'total_price', 'is_active')
    search_fields = ('sale__id', 'product__name')
    list_filter = ('is_active',)

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'previous_stock', 'new_stock', 'created_by', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('product__name',)
    readonly_fields = ('created_at', 'updated_at')

