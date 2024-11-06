# import pandas as pd
# import numpy as np

# # Set a random seed for reproducibility
# np.random.seed(42)

# # Number of samples and users
# num_samples = 1000
# user_ids = np.random.choice(range(1, 13), size=num_samples)

# # Define suspicious users
# suspicious_users = np.random.choice(range(1, 13), size=3, replace=False)  # Choose 3 suspicious users

# # Define data structure with new columns
# data = {
#     'id': user_ids,
#     'TransactionFrequency': np.random.randint(1, 5, size=num_samples),
#     'AverageTransactionAmount': np.random.uniform(100, 500, size=num_samples),
#     'MaxTransactionAmount': np.random.uniform(500, 1500, size=num_samples),
#     'UniqueRecipients': np.random.randint(1, 5, size=num_samples),
#     'TransactionTime': np.random.choice([0, 1], size=num_samples, p=[0.8, 0.2]),  # 0=normal, 1=unusual
#     'JustBelowThreshold': (np.random.uniform(900, 999, size=num_samples) < 1000).astype(int),
#     'IsSuspicious': np.zeros(num_samples)
# }

# # Assign suspicious transactions for suspicious users
# for user_id in suspicious_users:
#     user_indices = np.where(user_ids == user_id)[0]
#     data['IsSuspicious'][user_indices] = 1
#     data['TransactionFrequency'][user_indices] = np.random.randint(10, 25, size=len(user_indices))
#     data['AverageTransactionAmount'][user_indices] = np.random.uniform(1000, 2000, size=len(user_indices))
#     data['MaxTransactionAmount'][user_indices] = np.random.uniform(2000, 5000, size=len(user_indices))
#     data['UniqueRecipients'][user_indices] = np.random.randint(5, 10, size=len(user_indices))
#     data['TransactionTime'][user_indices] = 1
#     data['JustBelowThreshold'][user_indices] = 1

# # Create DataFrame and save
# df = pd.DataFrame(data)
# df.to_csv('synthetic_transactions_updated.csv', index=False)
# print("Synthetic data generated and saved.")


import pandas as pd
import numpy as np

# Set a random seed for reproducibility
np.random.seed(42)

# Number of samples and users
num_samples = 1000
user_ids = np.random.choice(range(1, 13), size=num_samples)

# Define suspicious users
suspicious_users = np.random.choice(range(1, 13), size=3, replace=False)  # Choose 3 suspicious users

# Initialize data structure with new columns
data = {
    'id': user_ids,
    'TransactionFrequency': np.random.randint(1, 5, size=num_samples),
    'IncomingTransactionAmount': np.random.uniform(100, 500, size=num_samples),  # Regular incoming
    'OutgoingTransactionAmount': np.random.uniform(100, 500, size=num_samples),  # Regular outgoing
    'MaxIncomingAmount': np.random.uniform(500, 1500, size=num_samples),  # Max incoming
    'MaxOutgoingAmount': np.random.uniform(500, 1500, size=num_samples),  # Max outgoing
    'UniqueRecipients': np.random.randint(1, 5, size=num_samples),
    'TransactionTime': np.random.choice([0, 1], size=num_samples, p=[0.8, 0.2]),  # 0=normal, 1=unusual
    'JustBelowThreshold': (np.random.uniform(900, 999, size=num_samples) < 1000).astype(int),
    'IsSuspicious': np.zeros(num_samples, dtype=int)  # Ensure this is an integer array
}

# Assign suspicious transactions for suspicious users
for user_id in suspicious_users:
    user_indices = np.where(user_ids == user_id)[0]
    
    # Mark as suspicious
    data['IsSuspicious'][user_indices] = 1
    
    # Create high transaction values for suspicious users with random variability
    num_suspicious = len(user_indices)
    
    # Randomly generate both small and large transaction amounts for suspicious users
    data['TransactionFrequency'][user_indices] = np.random.randint(10, 25, size=num_suspicious)  # High frequency
    data['IncomingTransactionAmount'][user_indices] = np.random.choice(
        [np.random.uniform(1000, 2000), np.random.uniform(3000, 8000)], size=num_suspicious
    )  # Randomly select between a lower and upper range
    data['OutgoingTransactionAmount'][user_indices] = np.random.choice(
        [np.random.uniform(1000, 2000), np.random.uniform(3000, 8000)], size=num_suspicious
    )  # Randomly select between a lower and upper range
    data['MaxIncomingAmount'][user_indices] = np.random.uniform(3000, 8000, size=num_suspicious)  # High max incoming
    data['MaxOutgoingAmount'][user_indices] = np.random.uniform(3000, 8000, size=num_suspicious)  # High max outgoing
    data['UniqueRecipients'][user_indices] = np.random.randint(5, 15, size=num_suspicious)  # More unique recipients
    data['TransactionTime'][user_indices] = 1  # Mark as unusual
    data['JustBelowThreshold'][user_indices] = 1  # Indicating a high amount

# Generate random timestamps for transactions
dates = pd.date_range(start='2024-01-01', periods=num_samples, freq='h')  # Hourly timestamps

# Convert to a regular array, shuffle it, and convert back to DatetimeIndex
dates_array = dates.to_numpy()
np.random.shuffle(dates_array)
shuffled_dates = pd.DatetimeIndex(dates_array)

data['TransactionDate'] = shuffled_dates

# Create DataFrame and save
df = pd.DataFrame(data)
df.to_csv('synthetic_transactions_updated.csv', index=False)
print("Synthetic data generated and saved.")