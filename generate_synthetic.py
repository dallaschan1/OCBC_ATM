import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# Generate synthetic data for each day per ATM
def generate_daily_synthetic_data(atm_count=10, years=4):
    locations = [
        'Downtown Branch', 'Airport Terminal 1', 'Mall Entrance', 'Train Station',
        'Suburb', 'University Campus', 'Hospital', 'Business District',
        'Residential Area', 'Industrial Zone'
    ]
    atm_names = [f'ATM-{i}' for i in range(100, 200)]

    start_date = datetime.today() - timedelta(days=years * 365)
    end_date = datetime.today()
    
    data = []
    
    for atm_id in range(atm_count):
        location = locations[atm_id % len(locations)]  # Ensure unique locations
        name = np.random.choice(atm_names)
        max_cash_capacity = np.random.choice([40000, 50000, 60000])
        avg_daily_withdrawal = np.random.uniform(2000, 6000)
        
        last_refilled_date = start_date
        amount_of_cash_left = max_cash_capacity
        emergency_refill_count = 0
        
        transaction_history = []
        withdrawal_history = []
        
        current_date = start_date
        while current_date <= end_date:
            if len(transaction_history) >= 7:
                transaction_count = int(np.mean(transaction_history[-7:]) * np.random.uniform(0.9, 1.1))
                avg_daily_withdrawal = np.mean(withdrawal_history[-7:]) * np.random.uniform(0.9, 1.1)
            else:
                transaction_count = np.random.randint(50, 250)
                avg_daily_withdrawal = avg_daily_withdrawal * np.random.uniform(0.8, 1.2)
            
            daily_withdrawal = avg_daily_withdrawal * np.random.uniform(0.8, 1.2)
            transaction_history.append(transaction_count)
            withdrawal_history.append(daily_withdrawal)
            
            # Reduce cash left, refill if necessary
            amount_of_cash_left -= daily_withdrawal
            if amount_of_cash_left <= 0:
                last_refilled_date = current_date
                amount_of_cash_left = max_cash_capacity
                emergency_refill_count += 1 if np.random.rand() < 0.1 else 0
            
            last_week_withdrawal = np.sum(withdrawal_history[-7:]) if len(withdrawal_history) >= 7 else avg_daily_withdrawal * 7
            days_since_last_refill = (current_date - last_refilled_date).days
            
            data.append([
                current_date, location, name, amount_of_cash_left, max_cash_capacity,
                avg_daily_withdrawal, transaction_count, last_week_withdrawal,
                emergency_refill_count, days_since_last_refill
            ])
            
            current_date += timedelta(days=1)

    columns = ['date', 'location', 'name', 'amount_of_cash_left', 'max_cash_capacity',
               'avg_daily_withdrawal', 'transaction_count', 'last_week_withdrawal',
               'emergency_refill_count', 'days_since_last_refill']

    df = pd.DataFrame(data, columns=columns)
    
    # Sort data to ensure shift works correctly
    df.sort_values(by=['name', 'date'], inplace=True)
    
    # Create balance_next_day target
    df['balance_next_day'] = df.groupby('name')['amount_of_cash_left'].shift(-1)
    
    # Drop last row per ATM since they don't have a next day balance
    df.dropna(subset=['balance_next_day'], inplace=True)
    
    # Remove impossible-to-know features
    df.drop(columns=['date'], inplace=True)
    
    return df

# Generate dataset
df = generate_daily_synthetic_data(atm_count=10, years=4)

# Save to CSV
df.to_csv("atm_synthetic_data.csv", index=False)

# Print confirmation
print("Synthetic ATM data with balance_next_day saved to atm_synthetic_data.csv")
