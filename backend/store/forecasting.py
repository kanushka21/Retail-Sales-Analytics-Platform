import pandas as pd
import numpy as np
from datetime import timedelta
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from django.db.models import Sum
from django.db.models.functions import TruncDay
from .models import Sale

def generate_forecast(days_to_predict=7):
    """
    Generates a sales forecast using Linear Regression.
    Returns a dictionary with historical data, forecast data, and model metrics.
    Raises ValueError if there is insufficient historical data.
    """
    MIN_DAYS_REQUIRED = 14

    # 1. Fetch historical sales grouped by day, ordered chronologically
    sales_qs = Sale.objects.annotate(
        day=TruncDay('sale_date')
    ).values('day').annotate(
        total_revenue=Sum('total_amount')
    ).order_by('day')

    if not sales_qs.exists():
        raise ValueError("Not enough historical sales data to generate a reliable forecast.")

    df = pd.DataFrame(sales_qs)
    
    if len(df) < MIN_DAYS_REQUIRED:
        raise ValueError(f"Not enough historical sales data to generate a reliable forecast. Required: {MIN_DAYS_REQUIRED} days, Found: {len(df)} days.")

    # 2. Prepare dataframe
    df['day'] = pd.to_datetime(df['day']).dt.tz_localize(None) # Remove tz for easier manipulation
    
    # We must ensure there are no missing dates in between
    # Create a complete date range from min to max date
    min_date = df['day'].min()
    max_date = df['day'].max()
    all_days = pd.date_range(start=min_date, end=max_date, freq='D')
    
    df = df.set_index('day').reindex(all_days).fillna({'total_revenue': 0.0}).rename_axis('day').reset_index()

    # If even after reindexing we have < MIN_DAYS_REQUIRED, fail
    if len(df) < MIN_DAYS_REQUIRED:
         raise ValueError(f"Not enough historical sales data to generate a reliable forecast. Required: {MIN_DAYS_REQUIRED} days, Found: {len(df)} days.")

    # 3. Feature Engineering
    df['day_of_week'] = df['day'].dt.dayofweek
    df['day_of_month'] = df['day'].dt.day
    df['month'] = df['day'].dt.month
    df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
    
    # Add a time index feature (days since start) for overall trend
    df['time_idx'] = np.arange(len(df))

    X = df[['time_idx', 'day_of_week', 'day_of_month', 'month', 'is_weekend']]
    y = df['total_revenue']

    # 4. Train-Test Split (Chronological)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    # 5. Model Training & Evaluation
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # 6. Retrain on full dataset for final future prediction
    final_model = LinearRegression()
    final_model.fit(X, y)

    # 7. Generate Future Dates and Predict
    future_dates = pd.date_range(start=max_date + timedelta(days=1), periods=days_to_predict, freq='D')
    
    future_df = pd.DataFrame({'day': future_dates})
    future_df['day_of_week'] = future_df['day'].dt.dayofweek
    future_df['day_of_month'] = future_df['day'].dt.day
    future_df['month'] = future_df['day'].dt.month
    future_df['is_weekend'] = future_df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
    future_df['time_idx'] = np.arange(len(df), len(df) + days_to_predict)

    X_future = future_df[['time_idx', 'day_of_week', 'day_of_month', 'month', 'is_weekend']]
    
    future_predictions = final_model.predict(X_future)
    # Ensure no negative predictions for revenue
    future_predictions = np.maximum(future_predictions, 0)

    # 8. Format output
    historical_data = [
        {
            "date": row['day'].strftime('%Y-%m-%d'),
            "revenue": float(row['total_revenue'])
        }
        for _, row in df.iterrows()
    ]

    forecast_data = [
        {
            "date": future_dates[i].strftime('%Y-%m-%d'),
            "predicted_revenue": float(future_predictions[i])
        }
        for i in range(days_to_predict)
    ]

    return {
        "forecast_days": days_to_predict,
        "historical_data": historical_data,
        "forecast": forecast_data,
        "model_metrics": {
            "mae": float(mae),
            "rmse": float(rmse),
            "algorithm": "Linear Regression"
        }
    }
