from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .forecasting import generate_forecast

class SalesForecastView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days_str = request.query_params.get('days', '7')
        
        try:
            days = int(days_str)
        except ValueError:
            return Response(
                {"error": "Invalid days parameter. Must be an integer."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if days not in [7, 30]:
            return Response(
                {"error": "Forecast period must be 7 or 30 days."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            forecast_data = generate_forecast(days_to_predict=days)
            return Response(forecast_data, status=status.HTTP_200_OK)
        except ValueError as e:
            # Handles "Not enough historical sales data..."
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Catch unexpected pandas/sklearn errors gracefully
            return Response(
                {"error": f"An error occurred while generating the forecast: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
