from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, CustomerViewSet, InventoryViewSet, SaleViewSet, SupplierViewSet
from .analytics_views import AnalyticsSummaryView, SalesTrendView, CategorySalesView, TopProductsView, PaymentMethodsView
from .report_views import SalesReportView, ProductReportView, InventoryReportView, CustomerReportView, FinancialReportView
from .forecasting_views import SalesForecastView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'suppliers', SupplierViewSet, basename='supplier')


urlpatterns = [
    path('', include(router.urls)),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('analytics/sales-trend/', SalesTrendView.as_view(), name='analytics-sales-trend'),
    path('analytics/category-sales/', CategorySalesView.as_view(), name='analytics-category-sales'),
    path('analytics/top-products/', TopProductsView.as_view(), name='analytics-top-products'),
    path('analytics/payment-methods/', PaymentMethodsView.as_view(), name='analytics-payment-methods'),
    
    # ML Forecasting
    path('analytics/forecast/', SalesForecastView.as_view(), name='analytics-forecast'),

    # Reports
    path('reports/sales/', SalesReportView.as_view(), name='report-sales'),
    path('reports/products/', ProductReportView.as_view(), name='report-products'),
    path('reports/inventory/', InventoryReportView.as_view(), name='report-inventory'),
    path('reports/customers/', CustomerReportView.as_view(), name='report-customers'),
    path('reports/financial/', FinancialReportView.as_view(), name='report-financial'),
]
