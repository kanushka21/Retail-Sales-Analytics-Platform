from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils.timezone import make_aware, get_current_timezone
from datetime import timedelta
import datetime
from .models import Sale, SaleItem, Product, Customer

def parse_date(date_str, default=None):
    if not date_str:
        return default
    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return make_aware(dt, timezone=get_current_timezone())
    except ValueError:
        return default

class AnalyticsSummaryView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = parse_date(request.query_params.get('start_date'))
        end_date = parse_date(request.query_params.get('end_date'))

        sales_qs = Sale.objects.all()
        sale_items_qs = SaleItem.objects.all()

        if start_date:
            sales_qs = sales_qs.filter(sale_date__gte=start_date)
            sale_items_qs = sale_items_qs.filter(sale__sale_date__gte=start_date)
        if end_date:
            end_date_time = end_date.replace(hour=23, minute=59, second=59)
            sales_qs = sales_qs.filter(sale_date__lte=end_date_time)
            sale_items_qs = sale_items_qs.filter(sale__sale_date__lte=end_date_time)

        # Sales KPIs
        sales_agg = sales_qs.aggregate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id')
        )
        total_revenue = sales_agg['total_revenue'] or 0
        total_orders = sales_agg['total_orders'] or 0

        # Profit and Units
        items_agg = sale_items_qs.aggregate(
            total_units=Sum('quantity'),
            total_profit=Sum((F('unit_price') - F('cost_price')) * F('quantity'))
        )
        total_units = items_agg['total_units'] or 0
        total_profit = items_agg['total_profit'] or 0

        # General KPIs
        total_customers = Customer.objects.count()
        total_products = Product.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(is_active=True, current_stock__lte=F('minimum_stock_level'), current_stock__gt=0).count()
        out_of_stock = Product.objects.filter(is_active=True, current_stock__lte=0).count()

        return Response({
            'total_revenue': float(total_revenue),
            'total_profit': float(total_profit),
            'total_orders': total_orders,
            'total_customers': total_customers,
            'total_products': total_products,
            'total_units_sold': total_units,
            'low_stock_count': low_stock,
            'out_of_stock_count': out_of_stock
        })

class SalesTrendView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = parse_date(request.query_params.get('start_date'))
        end_date = parse_date(request.query_params.get('end_date'))
        
        sales_qs = Sale.objects.all()
        
        if start_date:
            sales_qs = sales_qs.filter(sale_date__gte=start_date)
        if end_date:
            end_date_time = end_date.replace(hour=23, minute=59, second=59)
            sales_qs = sales_qs.filter(sale_date__lte=end_date_time)

        # Determine truncation logically
        period = 'daily'
        if start_date and end_date:
            delta = end_date - start_date
            if delta.days > 60:
                period = 'monthly'
        
        trunc_func = TruncMonth('sale_date') if period == 'monthly' else TruncDay('sale_date')

        trends = sales_qs.annotate(date=trunc_func).values('date').annotate(
            revenue=Sum('total_amount'),
            orders=Count('id')
        ).order_by('date')

        # Format date for frontend
        data = []
        for t in trends:
            if not t['date']:
                continue
            if period == 'monthly':
                label = t['date'].strftime('%b %Y')
            else:
                label = t['date'].strftime('%b %d')
            data.append({
                'date': label,
                'revenue': float(t['revenue'] or 0),
                'orders': t['orders']
            })

        return Response(data)

class CategorySalesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = parse_date(request.query_params.get('start_date'))
        end_date = parse_date(request.query_params.get('end_date'))

        items_qs = SaleItem.objects.all()
        if start_date:
            items_qs = items_qs.filter(sale__sale_date__gte=start_date)
        if end_date:
            end_date_time = end_date.replace(hour=23, minute=59, second=59)
            items_qs = items_qs.filter(sale__sale_date__lte=end_date_time)

        data = items_qs.values(
            category_name=F('product__category__name')
        ).annotate(
            revenue=Sum('total_price'),
            units=Sum('quantity')
        ).order_by('-revenue')

        formatted = []
        for d in data:
            formatted.append({
                'category': d['category_name'] or 'Uncategorized',
                'revenue': float(d['revenue'] or 0),
                'units': d['units']
            })
        return Response(formatted)

class TopProductsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = parse_date(request.query_params.get('start_date'))
        end_date = parse_date(request.query_params.get('end_date'))

        items_qs = SaleItem.objects.all()
        if start_date:
            items_qs = items_qs.filter(sale__sale_date__gte=start_date)
        if end_date:
            end_date_time = end_date.replace(hour=23, minute=59, second=59)
            items_qs = items_qs.filter(sale__sale_date__lte=end_date_time)

        data = items_qs.values(
            product_name=F('product__name')
        ).annotate(
            revenue=Sum('total_price'),
            units=Sum('quantity')
        ).order_by('-units')[:10]

        formatted = []
        for d in data:
            formatted.append({
                'product_name': d['product_name'],
                'revenue': float(d['revenue'] or 0),
                'units': d['units']
            })

        return Response(formatted)

class PaymentMethodsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = parse_date(request.query_params.get('start_date'))
        end_date = parse_date(request.query_params.get('end_date'))
        
        sales_qs = Sale.objects.all()
        if start_date:
            sales_qs = sales_qs.filter(sale_date__gte=start_date)
        if end_date:
            end_date_time = end_date.replace(hour=23, minute=59, second=59)
            sales_qs = sales_qs.filter(sale_date__lte=end_date_time)

        data = sales_qs.values('payment_method').annotate(
            revenue=Sum('total_amount'),
            transactions=Count('id')
        ).order_by('-revenue')

        formatted = []
        # Mapping constants from model manually or dynamically if needed, 
        # model uses choices, but values() returns the key. We can just title it.
        for d in data:
            formatted.append({
                'payment_method': d['payment_method'].replace('_', ' ').title() if d['payment_method'] else 'Unknown',
                'revenue': float(d['revenue'] or 0),
                'transactions': d['transactions']
            })

        return Response(formatted)
