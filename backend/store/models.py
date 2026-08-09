from django.db import models

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    is_active = models.BooleanField(default=True, verbose_name="Active Status")

    class Meta:
        abstract = True

class Category(BaseModel):
    name = models.CharField(max_length=100, unique=True, verbose_name="Category Name")
    description = models.TextField(blank=True, verbose_name="Description")

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Supplier(BaseModel):
    company_name = models.CharField(max_length=200, verbose_name="Company Name")
    contact_person = models.CharField(max_length=150, verbose_name="Contact Person")
    email = models.EmailField(verbose_name="Email")
    phone = models.CharField(max_length=20, verbose_name="Phone")
    address = models.TextField(verbose_name="Address")

    def __str__(self):
        return self.company_name

class Product(BaseModel):
    name = models.CharField(max_length=200, verbose_name="Product Name")
    sku = models.CharField(max_length=50, unique=True, verbose_name="SKU")
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True, verbose_name="Barcode")
    description = models.TextField(blank=True, verbose_name="Description")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products", verbose_name="Category")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name="products", verbose_name="Supplier")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Cost Price")
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Selling Price")
    current_stock = models.IntegerField(default=0, verbose_name="Current Stock")
    minimum_stock_level = models.IntegerField(default=0, verbose_name="Minimum Stock Level")

    def __str__(self):
        return f"{self.name} ({self.sku})"

class Customer(BaseModel):
    full_name = models.CharField(max_length=150, verbose_name="Full Name")
    email = models.EmailField(unique=True, verbose_name="Email")
    phone = models.CharField(max_length=20, verbose_name="Phone")
    address = models.TextField(verbose_name="Address")

    def __str__(self):
        return self.full_name

class Inventory(BaseModel):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="inventory_log", verbose_name="Product")
    quantity = models.IntegerField(default=0, verbose_name="Quantity")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="Last Updated")

    class Meta:
        verbose_name_plural = "Inventories"

    def __str__(self):
        return f"Inventory for {self.product.name}"

class Sale(BaseModel):
    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('ONLINE', 'Online Transfer'),
    )
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name="sales", verbose_name="Customer")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Total Amount")
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Discount")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='CASH', verbose_name="Payment Method")
    sale_date = models.DateTimeField(auto_now_add=True, verbose_name="Sale Date")

    def __str__(self):
        return f"Sale #{self.id} - {self.customer.full_name if self.customer else 'Guest'}"

class SaleItem(BaseModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items", verbose_name="Sale")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="sale_items", verbose_name="Product")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantity")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Unit Price")
    total_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Total Price")

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Unknown Product'}"
