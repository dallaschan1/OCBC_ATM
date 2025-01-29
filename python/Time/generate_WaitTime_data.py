import pandas as pd
import numpy as np
from datetime import datetime

# Define parameters
ATM_IDS = [1, 2, 3]
TIME_OF_DAY = ["Morning", "Afternoon", "Evening", "Night"]
DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
NUM_WEEKS = 12  # Number of weeks to generate data for
WEATHER_CONDITIONS = ["Sunny", "Rainy", "Cloudy", "Windy"]
PUBLIC_HOLIDAYS = ["2025-01-01", "2025-08-09"]  # Example public holidays: New Year's Day, National Day

# Define bank hours (9 AM to 5 PM)
PEAK_HOURS = {
    "Morning": 1,   # 9 AM - 12 PM (Banking hours)
    "Afternoon": 1, # 12 PM - 5 PM (Banking hours)
    "Evening": 0,   # After 5 PM (Non-banking hours)
    "Night": 0      # After 5 PM (Non-banking hours)
}

# Initialize random seed for reproducibility
np.random.seed(42)
data = []

# Helper mappings
time_of_day_mapping = {"Morning": 1, "Afternoon": 2, "Evening": 3, "Night": 4}
day_of_week_mapping = {day: i + 1 for i, day in enumerate(DAYS_OF_WEEK)}
weather_condition_mapping = {"Sunny": 1, "Rainy": 2, "Cloudy": 3, "Windy": 4}

# Desired distribution of wait times (target counts for each value in [2, 10])
target_distribution = {i: 100 for i in range(2, 11)}  # Aim for ~100 occurrences for each value
current_distribution = {i: 0 for i in range(2, 11)}  # Initialize current counts

# Generate synthetic data
for week in range(NUM_WEEKS):
    for atm_id in ATM_IDS:
        for day in DAYS_OF_WEEK:
            for time in TIME_OF_DAY:
                weather_condition = np.random.choice(WEATHER_CONDITIONS)  # Random weather condition

                # Adjust transaction volume based on weather condition
                if weather_condition == "Rainy":
                    transaction_volume = np.random.randint(50, 150)  # Lower volume for rainy days
                else:
                    transaction_volume = np.random.randint(50, 300)  # Normal range for transaction volume

                # Calculate the date based on week and day (using a simple format here)
                date_str = f"2025-{week+1:02d}-{DAYS_OF_WEEK.index(day)+1:02d}"
                is_public_holiday = 1 if date_str in PUBLIC_HOLIDAYS else 0  # Check if public holiday

                # Determine if it's peak hours (based on time of day)
                in_peak_hours = PEAK_HOURS.get(time, 0)  # Default to 0 if time not found in PEAK_HOURS

                # Generate additional features
                average_queue_length = np.random.uniform(0.5, 10.0)  # Random average queue length between 0.5 and 10 users

                # Base wait time generation logic
                wait_time = 0

                # Adjust wait time based on time of day
                if time in ["Morning", "Afternoon"]:
                    wait_time += np.random.uniform(2, 4)
                else:
                    wait_time += np.random.uniform(1, 2)

                # Transaction volume impact
                wait_time += transaction_volume * np.random.uniform(0.005, 0.02)

                # Weather impact
                if weather_condition == "Rainy":
                    wait_time -= np.random.uniform(0.5, 1.0)

                # Public holiday impact
                if is_public_holiday:
                    wait_time += np.random.uniform(0.5, 1.5)

                # Average queue length impact
                wait_time += average_queue_length * np.random.uniform(0.1, 0.2)

                # Apply balancing mechanism
                wait_time = round(wait_time)  # Round to the nearest integer
                wait_time = max(2, min(10, wait_time))  # Constrain to [2, 10]

                # Check if we can add this wait time to maintain balance
                if current_distribution[wait_time] < target_distribution[wait_time]:
                    current_distribution[wait_time] += 1  # Increment the count for this wait time
                else:
                    continue  # Skip this data point to maintain balance

                # Append data
                data.append({
                    "ATMID": atm_id,
                    "Week": week + 1,
                    "DayOfWeek": day_of_week_mapping[day],  # Using numeric DayOfWeek
                    "TimeOfDay": time_of_day_mapping[time],  # Using numeric TimeOfDay
                    "TransactionVolume": transaction_volume,
                    "WeatherCondition": weather_condition_mapping[weather_condition],  # Using numeric WeatherCondition
                    "IsPublicHoliday": is_public_holiday,
                    "InPeakHours": in_peak_hours,
                    "AverageQueueLength": average_queue_length,
                    "WaitTime": float(wait_time)  # Balanced WaitTime
                })

# Create DataFrame and save to CSV
df = pd.DataFrame(data)
df.to_csv("python/Time/synthetic_atm_data.csv", index=False)
print("Balanced synthetic data saved to 'synthetic_atm_data_balanced.csv'")
