from rest_framework import serializers
from .models import Product, Category, Customer, Inventory, StockMovement, Sale, SaleItem, Supplier

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'company_name', 'contact_person', 'email', 'phone', 'address', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_company_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Company name cannot be empty.")
        return value

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'description', 
            'category', 'category_name', 'supplier', 
            'cost_price', 'selling_price', 'current_stock', 
            'minimum_stock_level', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_cost_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost price cannot be negative.")
        return value

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Selling price cannot be negative.")
        return value

    def validate_current_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_minimum_stock_level(self, value):
        if value < 0:
            raise serializers.ValidationError("Minimum stock level cannot be negative.")
        return value

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Product name cannot be empty.")
        return value

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'full_name', 'email', 'phone', 'address', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Full name cannot be empty.")
        return value

    def validate_phone(self, value):
        if not value.strip():
            raise serializers.ValidationError("Phone number cannot be empty.")
        return value

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True, default='')
    minimum_stock_level = serializers.IntegerField(source='product.minimum_stock_level', read_only=True)
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'product_barcode',
            'category_name', 'quantity', 'minimum_stock_level', 'stock_status',
            'last_updated', 'created_at', 'is_active'
        ]
        read_only_fields = ['id', 'product', 'quantity', 'last_updated', 'created_at']

class StockAdjustmentSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', default='System', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'inventory',
            'movement_type', 'quantity', 'previous_stock', 'new_stock',
            'reason', 'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = ['id', 'product', 'inventory', 'movement_type', 'quantity', 'previous_stock', 'new_stock', 'reason', 'created_by', 'created_at']


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'product_sku', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['id', 'unit_price', 'total_price']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', default='System', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'customer', 'customer_name', 'subtotal', 'discount', 
            'total_amount', 'payment_method', 'sale_date', 
            'created_by', 'created_by_username', 'items'
        ]
        read_only_fields = ['id', 'subtotal', 'total_amount', 'sale_date', 'created_by']


class SaleCreateSerializer(serializers.Serializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = serializers.ChoiceField(choices=Sale.PAYMENT_METHODS, default='CASH')
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )

    def validate_discount(self, value):
        if value < 0:
            raise serializers.ValidationError("Discount cannot be negative.")
        return value
