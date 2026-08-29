import random
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from store.models import Category, Supplier, Product, Customer, Sale, SaleItem, Inventory, StockMovement

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with realistic sample data for the Retail Sales Analytics Platform'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='CAUTION: Delete existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting database...'))
            SaleItem.objects.all().delete()
            Sale.objects.all().delete()
            StockMovement.objects.all().delete()
            Inventory.objects.all().delete()
            Product.objects.all().delete()
            Customer.objects.all().delete()
            Supplier.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        user = User.objects.first()
        if not user:
            self.stdout.write(self.style.ERROR('No admin user found. Please create a superuser first.'))
            return

        self.seed_categories()
        self.seed_suppliers()
        self.seed_customers()
        self.seed_products()
        self.seed_sales(user)

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
        
        # Print summary
        self.stdout.write(f"Categories: {Category.objects.count()}")
        self.stdout.write(f"Suppliers: {Supplier.objects.count()}")
        self.stdout.write(f"Customers: {Customer.objects.count()}")
        self.stdout.write(f"Products: {Product.objects.count()}")
        self.stdout.write(f"Sales: {Sale.objects.count()}")

    def seed_categories(self):
        categories = ['Electronics', 'Computers', 'Accessories', 'Home Appliances', 'Office Supplies']
        for name in categories:
            Category.objects.get_or_create(name=name, defaults={'description': f'{name} products and accessories'})
        self.stdout.write('Seeded Categories')

    def seed_suppliers(self):
        suppliers = [
            ('TechSource Distributors', 'John Doe', 'john@techsource.com', '1234567890'),
            ('Lanka Digital Supplies', 'Kamal Perera', 'kamal@lankadigital.com', '0987654321'),
            ('Metro Electronics Wholesale', 'Jane Smith', 'jane@metroelec.com', '1122334455'),
            ('Smart Office Suppliers', 'Mike Johnson', 'mike@smartoffice.com', '5566778899'),
            ('Global Device Traders', 'Sarah Connor', 'sarah@globaldevice.com', '9988776655'),
        ]
        for company, contact, email, phone in suppliers:
            Supplier.objects.get_or_create(
                company_name=company,
                defaults={
                    'contact_person': contact,
                    'email': email,
                    'phone': phone,
                    'address': '123 Business Road, City'
                }
            )
        self.stdout.write('Seeded Suppliers')

    def seed_customers(self):
        customers = [
            ('Alice Brown', 'alice@example.com', '1010101010'),
            ('Bob White', 'bob@example.com', '2020202020'),
            ('Charlie Green', 'charlie@example.com', '3030303030'),
            ('Diana Black', 'diana@example.com', '4040404040'),
            ('Evan Gray', 'evan@example.com', '5050505050'),
            ('Fiona Blue', 'fiona@example.com', '6060606060'),
            ('George Red', 'george@example.com', '7070707070'),
            ('Hannah Silver', 'hannah@example.com', '8080808080'),
            ('Ian Gold', 'ian@example.com', '9090909090'),
            ('Jenny Purple', 'jenny@example.com', '0101010101'),
            ('Kevin Orange', 'kevin@example.com', '1212121212'),
            ('Laura Pink', 'laura@example.com', '2323232323'),
            ('Mark Yellow', 'mark@example.com', '3434343434'),
            ('Nancy Cyan', 'nancy@example.com', '4545454545'),
            ('Oscar Magenta', 'oscar@example.com', '5656565656'),
        ]
        for name, email, phone in customers:
            Customer.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': name,
                    'phone': phone,
                    'address': 'Customer Address, Home City'
                }
            )
        self.stdout.write('Seeded Customers')

    def seed_products(self):
        cat_electronics = Category.objects.get(name='Electronics')
        cat_computers = Category.objects.get(name='Computers')
        cat_accessories = Category.objects.get(name='Accessories')
        cat_home = Category.objects.get(name='Home Appliances')
        cat_office = Category.objects.get(name='Office Supplies')

        sup_tech = Supplier.objects.get(company_name='TechSource Distributors')
        sup_metro = Supplier.objects.get(company_name='Metro Electronics Wholesale')
        sup_office = Supplier.objects.get(company_name='Smart Office Suppliers')

        products_data = [
            ('Dell Inspiron Laptop', 'LPT-001', cat_computers, sup_tech, 600.00, 850.00, 15, 5),
            ('Lenovo ThinkPad', 'LPT-002', cat_computers, sup_tech, 800.00, 1100.00, 10, 3),
            ('Samsung Galaxy Phone', 'PHN-001', cat_electronics, sup_metro, 400.00, 650.00, 20, 5),
            ('Xiaomi Smartphone', 'PHN-002', cat_electronics, sup_metro, 200.00, 350.00, 35, 10),
            ('Wireless Mouse', 'ACC-001', cat_accessories, sup_tech, 10.00, 25.00, 50, 15),
            ('Mechanical Keyboard', 'ACC-002', cat_accessories, sup_tech, 40.00, 85.00, 25, 10),
            ('USB-C Charger', 'ACC-003', cat_accessories, sup_metro, 5.00, 15.00, 100, 20),
            ('Bluetooth Headphones', 'ACC-004', cat_accessories, sup_metro, 30.00, 75.00, 40, 10),
            ('Power Bank 10000mAh', 'ACC-005', cat_accessories, sup_metro, 15.00, 35.00, 60, 15),
            ('External Hard Drive 1TB', 'ACC-006', cat_accessories, sup_tech, 45.00, 80.00, 30, 5),
            ('24-inch Monitor', 'CMP-003', cat_computers, sup_tech, 120.00, 190.00, 15, 5),
            ('Laser Printer', 'OFC-001', cat_office, sup_office, 150.00, 220.00, 8, 3),
            ('1080p Webcam', 'ACC-007', cat_accessories, sup_tech, 25.00, 55.00, 0, 5), # Out of stock
            ('Ergonomic Office Chair', 'OFC-002', cat_office, sup_office, 80.00, 150.00, 5, 5), # Low stock
            ('LED Desk Lamp', 'OFC-003', cat_office, sup_office, 15.00, 35.00, 0, 10), # Out of stock
        ]

        for name, sku, cat, sup, cost, sell, stock, min_stock in products_data:
            Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': cat,
                    'supplier': sup,
                    'cost_price': Decimal(str(cost)),
                    'selling_price': Decimal(str(sell)),
                    'current_stock': stock,
                    'minimum_stock_level': min_stock,
                    'description': f'Realistic {name}',
                    'barcode': sku + '-BC'
                }
            )
        self.stdout.write('Seeded Products & Inventory')

    def seed_sales(self, user):
        customers = list(Customer.objects.all())
        products = list(Product.objects.filter(current_stock__gt=0))
        payment_methods = ['CASH', 'CARD', 'ONLINE']

        now = timezone.now()
        
        # Determine how many to create to reach 100 total
        current_count = Sale.objects.count()
        to_create = 100 - current_count
        
        if to_create <= 0:
            self.stdout.write('Sales already seeded. Skipping.')
            return

        for i in range(to_create):
            # Pick a random date in the last 120 days
            days_ago = random.randint(1, 120)
            sale_date = now - timedelta(days=days_ago)
            
            customer = random.choice(customers)
            payment_method = random.choice(payment_methods)
            
            # Select 1 to 4 random unique products
            num_items = random.randint(1, 4)
            sale_products = random.sample(products, min(num_items, len(products)))
            
            with transaction.atomic():
                sale = Sale.objects.create(
                    customer=customer,
                    subtotal=0,
                    discount=0,
                    total_amount=0,
                    payment_method=payment_method,
                    created_by=user
                )
                
                subtotal = Decimal('0.00')
                
                for product in sale_products:
                    # Refresh product to get latest stock
                    product.refresh_from_db()
                    
                    if product.current_stock <= 0:
                        continue
                        
                    max_qty = min(product.current_stock, random.randint(1, 3))
                    if max_qty == 0:
                        continue
                        
                    unit_price = product.selling_price
                    item_total = unit_price * max_qty
                    subtotal += item_total
                    
                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=max_qty,
                        cost_price=product.cost_price,
                        unit_price=unit_price,
                        total_price=item_total
                    )
                    
                    # Reduce stock exactly as the view does
                    previous_stock = product.current_stock
                    new_stock = previous_stock - max_qty
                    product.current_stock = new_stock
                    product.save(update_fields=['current_stock', 'updated_at'])
                    
                    inventory, _ = Inventory.objects.get_or_create(product=product)
                    StockMovement.objects.create(
                        product=product,
                        inventory=inventory,
                        movement_type='STOCK_OUT',
                        quantity=max_qty,
                        previous_stock=previous_stock,
                        new_stock=new_stock,
                        reason=f"Sale #{sale.id} (Seed)",
                        created_by=user
                    )
                
                # If no items were added (e.g. all out of stock), delete the sale and continue
                if subtotal == 0:
                    sale.delete()
                    continue

                discount = Decimal(str(random.choice([0, 0, 0, 5, 10, 15])))
                if discount > subtotal:
                    discount = Decimal('0.00')
                    
                total = subtotal - discount
                
                sale.subtotal = subtotal
                sale.discount = discount
                sale.total_amount = total
                sale.save()
                
                # Overwrite sale_date
                Sale.objects.filter(pk=sale.pk).update(sale_date=sale_date)

        self.stdout.write(f'Seeded {to_create} Sales')
