# import pandas as pd
# import numpy as np

# # Set a random seed for reproducibility
# np.random.seed(42)

# # Number of samples and users
# num_samples = 1000
# # Generate user_ids from 1 to 12
# user_ids = np.random.choice(range(1, 13), size=num_samples)

# # Define suspicious users (you can change this to have more or less suspicious users)
# suspicious_users = np.random.choice(range(1, 13), size=3, replace=False)  # Choose 3 suspicious users

# data = {
#     'id': user_ids,
#     'TransactionFrequency': np.random.randint(1, 5, size=num_samples),  # Set a default low frequency for all
#     'AverageTransactionAmount': np.random.uniform(100, 500, size=num_samples),  # Set a default lower amount for all
#     'MaxTransactionAmount': np.random.uniform(500, 1500, size=num_samples),  # Set a default lower amount for all
#     'UniqueRecipients': np.random.randint(1, 5, size=num_samples),  # Set a default lower unique recipients for all
#     'IsSuspicious': np.zeros(num_samples)  # Start with all non-suspicious
# }

# # Assign suspicious transactions for the chosen users
# for user_id in suspicious_users:
#     user_indices = np.where(user_ids == user_id)[0]
#     # Set all of this user's transactions as suspicious
#     # For this example, we'll assign suspicious to 100% of the chosen user's transactions
#     data['IsSuspicious'][user_indices] = 1  # All transactions of suspicious users are marked suspicious

# # Now, let's increase some attributes for suspicious users to make their profile more suspicious
# for user_id in suspicious_users:
#     user_indices = np.where(user_ids == user_id)[0]
#     data['TransactionFrequency'][user_indices] = np.random.randint(10, 25, size=len(user_indices))  # High frequency for suspicious users
#     data['AverageTransactionAmount'][user_indices] = np.random.uniform(1000, 2000, size=len(user_indices))  # High average for suspicious users
#     data['MaxTransactionAmount'][user_indices] = np.random.uniform(2000, 5000, size=len(user_indices))  # High max for suspicious users
#     data['UniqueRecipients'][user_indices] = np.random.randint(5, 10, size=len(user_indices))  # More unique recipients for suspicious users

# # Create DataFrame and save
# df = pd.DataFrame(data)
# df.to_csv('synthetic_transactions_updated.csv', index=False)

# print("Synthetic data generated and saved to 'synthetic_transactions_updated.csv'.")


import pandas as pd
import numpy as np

# Set a random seed for reproducibility
np.random.seed(42)

# Number of samples and users
num_samples = 1000
user_ids = np.random.choice(range(1, 13), size=num_samples)

# Define suspicious users
suspicious_users = np.random.choice(range(1, 13), size=3, replace=False)  # Choose 3 suspicious users

# Define data structure with new columns
data = {
    'id': user_ids,
    'TransactionFrequency': np.random.randint(1, 5, size=num_samples),
    'AverageTransactionAmount': np.random.uniform(100, 500, size=num_samples),
    'MaxTransactionAmount': np.random.uniform(500, 1500, size=num_samples),
    'UniqueRecipients': np.random.randint(1, 5, size=num_samples),
    'TransactionTime': np.random.choice([0, 1], size=num_samples, p=[0.8, 0.2]),  # 0=normal, 1=unusual
    'JustBelowThreshold': (np.random.uniform(900, 999, size=num_samples) < 1000).astype(int),
    'IsSuspicious': np.zeros(num_samples)
}

# Assign suspicious transactions for suspicious users
for user_id in suspicious_users:
    user_indices = np.where(user_ids == user_id)[0]
    data['IsSuspicious'][user_indices] = 1
    data['TransactionFrequency'][user_indices] = np.random.randint(10, 25, size=len(user_indices))
    data['AverageTransactionAmount'][user_indices] = np.random.uniform(1000, 2000, size=len(user_indices))
    data['MaxTransactionAmount'][user_indices] = np.random.uniform(2000, 5000, size=len(user_indices))
    data['UniqueRecipients'][user_indices] = np.random.randint(5, 10, size=len(user_indices))
    data['TransactionTime'][user_indices] = 1
    data['JustBelowThreshold'][user_indices] = 1

# Create DataFrame and save
df = pd.DataFrame(data)
df.to_csv('synthetic_transactions_updated.csv', index=False)
print("Synthetic data generated and saved.")
