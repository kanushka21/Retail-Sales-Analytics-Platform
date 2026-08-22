from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from datetime import timedelta
from datetime import datetime
from .models import Sale, SaleItem, Product, Customer

def get_date_range(period):
    now = timezone.now()
    if period == 'today':
        return now.replace(hour=0, minute=0, second=0, microsecond=0), now
    elif period == 'last_7_days':
        return now - timedelta(days=7), now
    elif period == 'last_30_days':
        return now - timedelta(days=30), now
    elif period == 'this_month':
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), now
    elif period == 'this_year':
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0), now
    return None, None

class AnalyticsSummaryView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'all')
        start_date, end_date = get_date_range(period)

        sales_qs = Sale.objects.all()
        sale_items_qs = SaleItem.objects.all()

        if start_date and end_date:
            sales_qs = sales_qs.filter(sale_date__gte=start_date, sale_date__lte=end_date)
            sale_items_qs = sale_items_qs.filter(sale__sale_date__gte=start_date, sale__sale_date__lte=end_date)

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
            'total_revenue': total_revenue,
            'total_profit': total_profit,
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
        period = request.query_params.get('period', 'monthly')
        
        trunc_func = TruncMonth('sale_date') if period == 'monthly' else TruncDay('sale_date')

        trends = Sale.objects.annotate(date=trunc_func).values('date').annotate(
            revenue=Sum('total_amount'),
            orders=Count('id')
        ).order_by('date')

        # Format date for frontend
        data = []
        for t in trends:
            if period == 'monthly':
                label = t['date'].strftime('%b %Y')
            else:
                label = t['date'].strftime('%b %d')
            data.append({
                'date': label,
                'revenue': t['revenue'],
                'orders': t['orders']
            })

        return Response(data)

class CategorySalesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = SaleItem.objects.values(
            category_name=F('product__category__name')
        ).annotate(
            revenue=Sum('total_price'),
            units=Sum('quantity')
        ).order_by('-revenue')

        formatted = []
        for d in data:
            formatted.append({
                'category': d['category_name'] or 'Uncategorized',
                'revenue': d['revenue'],
                'units': d['units']
            })
        return Response(formatted)

class TopProductsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = SaleItem.objects.values(
            product_name=F('product__name')
        ).annotate(
            revenue=Sum('total_price'),
            units=Sum('quantity')
        ).order_by('-units')[:10]

        return Response(data)

class PaymentMethodsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = Sale.objects.values('payment_method').annotate(
            revenue=Sum('total_amount'),
            transactions=Count('id')
        ).order_by('-revenue')

        return Response(data)
