from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F

from .models import Product, Category, Customer, Inventory, StockMovement, Sale, SaleItem
from .serializers import (
    ProductSerializer, CategorySerializer, CustomerSerializer,
    InventorySerializer, StockAdjustmentSerializer,
    SaleSerializer, SaleCreateSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku', 'barcode']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email', 'phone']

class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.filter(is_active=True).select_related('product', 'product__category')
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['product__name', 'product__sku', 'product__barcode']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        
        if status_param == 'low':
            queryset = queryset.filter(quantity__lte=F('product__minimum_stock_level'), quantity__gt=0)
        elif status_param == 'out':
            queryset = queryset.filter(quantity__lte=0)
        elif status_param == 'in_stock':
            queryset = queryset.filter(quantity__gt=F('product__minimum_stock_level'))
            
        return queryset

    @action(detail=True, methods=['post'], url_path='add-stock')
    def add_stock(self, request, pk=None):
        inventory = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            reason = serializer.validated_data.get('reason', '')
            
            with transaction.atomic():
                product = inventory.product
                previous_stock = product.current_stock
                new_stock = previous_stock + quantity
                
                # Update product (this will trigger the signal to update inventory)
                product.current_stock = new_stock
                product.save(update_fields=['current_stock', 'updated_at'])
                
                # Log movement
                StockMovement.objects.create(
                    product=product,
                    inventory=inventory,
                    movement_type='STOCK_IN',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    created_by=request.user
                )
                
            # Refresh inventory from db
            inventory.refresh_from_db()
            return Response(InventorySerializer(inventory).data)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='remove-stock')
    def remove_stock(self, request, pk=None):
        inventory = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            reason = serializer.validated_data.get('reason', '')
            
            with transaction.atomic():
                product = inventory.product
                previous_stock = product.current_stock
                new_stock = previous_stock - quantity
                
                if new_stock < 0:
                    return Response(
                        {"quantity": ["Cannot remove more stock than currently available."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update product
                product.current_stock = new_stock
                product.save(update_fields=['current_stock', 'updated_at'])
                
                # Log movement
                StockMovement.objects.create(
                    product=product,
                    inventory=inventory,
                    movement_type='STOCK_OUT',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    created_by=request.user
                )
                
from rest_framework import viewsets, filters, status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F

from .models import Product, Category, Customer, Inventory, StockMovement, Sale, SaleItem
from .serializers import (
    ProductSerializer, CategorySerializer, CustomerSerializer,
    InventorySerializer, StockAdjustmentSerializer,
    SaleSerializer, SaleCreateSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku', 'barcode']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email', 'phone']

class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.filter(is_active=True).select_related('product', 'product__category')
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['product__name', 'product__sku', 'product__barcode']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        
        if status_param == 'low':
            queryset = queryset.filter(quantity__lte=F('product__minimum_stock_level'), quantity__gt=0)
        elif status_param == 'out':
            queryset = queryset.filter(quantity__lte=0)
        elif status_param == 'in_stock':
            queryset = queryset.filter(quantity__gt=F('product__minimum_stock_level'))
            
        return queryset

    @action(detail=True, methods=['post'], url_path='add-stock')
    def add_stock(self, request, pk=None):
        inventory = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            reason = serializer.validated_data.get('reason', '')
            
            with transaction.atomic():
                product = inventory.product
                previous_stock = product.current_stock
                new_stock = previous_stock + quantity
                
                # Update product (this will trigger the signal to update inventory)
                product.current_stock = new_stock
                product.save(update_fields=['current_stock', 'updated_at'])
                
                # Log movement
                StockMovement.objects.create(
                    product=product,
                    inventory=inventory,
                    movement_type='STOCK_IN',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    created_by=request.user
                )
                
            # Refresh inventory from db
            inventory.refresh_from_db()
            return Response(InventorySerializer(inventory).data)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='remove-stock')
    def remove_stock(self, request, pk=None):
        inventory = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            quantity = serializer.validated_data['quantity']
            reason = serializer.validated_data.get('reason', '')
            
            with transaction.atomic():
                product = inventory.product
                previous_stock = product.current_stock
                new_stock = previous_stock - quantity
                
                if new_stock < 0:
                    return Response(
                        {"quantity": ["Cannot remove more stock than currently available."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update product
                product.current_stock = new_stock
                product.save(update_fields=['current_stock', 'updated_at'])
                
                # Log movement
                StockMovement.objects.create(
                    product=product,
                    inventory=inventory,
                    movement_type='STOCK_OUT',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=reason,
                    created_by=request.user
                )
                
            # Refresh inventory
            inventory.refresh_from_db()
            return Response(InventorySerializer(inventory).data)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['customer__full_name', 'payment_method']

    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        customer = data.get('customer')
        discount = data.get('discount')
        payment_method = data.get('payment_method')
        items_data = data.get('items')

        with transaction.atomic():
            subtotal = 0
            
            # Create the sale first (without totals)
            sale = Sale.objects.create(
                customer=customer,
                subtotal=0,
                discount=discount,
                total_amount=0,
                payment_method=payment_method,
                created_by=request.user
            )

            # Process items
            for item in items_data:
                product_id = item.get('product_id')
                quantity = int(item.get('quantity', 1))

                if quantity <= 0:
                    raise serializers.ValidationError({"error": f"Quantity must be positive for product ID {product_id}"})

                try:
                    product = Product.objects.select_for_update().get(id=product_id, is_active=True)
                except Product.DoesNotExist:
                    raise serializers.ValidationError({"error": f"Product ID {product_id} not found or inactive."})

                if product.current_stock < quantity:
                    raise serializers.ValidationError({"error": f"Insufficient stock for {product.name}."})

                # Calculate item total
                unit_price = product.selling_price
                item_total = unit_price * quantity
                subtotal += item_total

                # Create SaleItem
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    cost_price=product.cost_price,
                    unit_price=unit_price,
                    total_price=item_total
                )

                # Update product stock
                previous_stock = product.current_stock
                new_stock = previous_stock - quantity
                product.current_stock = new_stock
                product.save(update_fields=['current_stock', 'updated_at'])

                # Log stock movement
                inventory, _ = Inventory.objects.get_or_create(product=product)
                
                # Signal might have updated inventory, but let's be explicit with the log
                StockMovement.objects.create(
                    product=product,
                    inventory=inventory,
                    movement_type='STOCK_OUT',
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=f"Sale #{sale.id}",
                    created_by=request.user
                )

            # Finalize sale totals
            sale.subtotal = subtotal
            
            total_amount = subtotal - discount
            if total_amount < 0:
                raise serializers.ValidationError({"error": "Discount cannot exceed subtotal."})
                
            sale.total_amount = total_amount
            sale.save(update_fields=['subtotal', 'total_amount', 'updated_at'])

        # Return the created sale
        return_serializer = SaleSerializer(sale)
        return Response(return_serializer.data, status=status.HTTP_201_CREATED)
