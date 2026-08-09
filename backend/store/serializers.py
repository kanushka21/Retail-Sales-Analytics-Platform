from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

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
