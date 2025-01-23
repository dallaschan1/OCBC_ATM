# import pandas as pd
# import random
# from datetime import datetime, timedelta

# # Generate synthetic data
# user_id = 1  # Example UserID
# num_records = 20  # Set to 20 for both incoming and outgoing

# # Function to generate random transaction dates within the last 60 days
# def random_date_within_days(days=60):
#     start_date = datetime.now() - timedelta(days=days)
#     random_date = start_date + timedelta(days=random.randint(0, days))
#     return random_date

# # Function to generate a random time for each transaction
# def random_time():
#     hour = random.randint(0, 23)
#     minute = random.randint(0, 59)
#     second = random.randint(0, 59)
#     return f"{hour:02d}:{minute:02d}:{second:02d}"

# # Create synthetic transactions ensuring exactly 20 incoming and 20 outgoing
# data = []

# # Generate 20 Incoming Transactions
# for i in range(num_records):
#     amount = round(random.uniform(1000, 5000), 2)  # Larger amounts for incoming
#     random_date = random_date_within_days(60)
#     transaction_datetime = random_date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59), second=random.randint(0, 59))
#     data.append({
#         "UserID": user_id,
#         "TransactionID": f"T{2*i+1:04d}",  # Odd numbered IDs for incoming
#         "TransactionDate": transaction_datetime.strftime('%Y-%m-%d %H:%M:%S'),
#         "TransactionType": "Incoming",
#         "TransactionAmount": amount,
#         "TransactionHour": transaction_datetime.hour
#     })

# # Generate 20 Outgoing Transactions
# for i in range(num_records):
#     amount = round(random.uniform(10, 1000), 2)  # Smaller amounts for outgoing
#     random_date = random_date_within_days(60)
#     transaction_datetime = random_date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59), second=random.randint(0, 59))
#     data.append({
#         "UserID": user_id,
#         "TransactionID": f"T{2*i+2:04d}",  # Even numbered IDs for outgoing
#         "TransactionDate": transaction_datetime.strftime('%Y-%m-%d %H:%M:%S'),
#         "TransactionType": "Outgoing",
#         "TransactionAmount": amount,
#         "TransactionHour": transaction_datetime.hour
#     })

# # Convert the data to a DataFrame
# df = pd.DataFrame(data)

# # Ensure the data is sorted by TransactionDate to display in chronological order
# df['TransactionDate'] = pd.to_datetime(df['TransactionDate'])
# df = df.sort_values(by='TransactionDate')

# # Save the DataFrame to a CSV file
# csv_file_path = 'chart_data.csv'
# df.to_csv(csv_file_path, index=False)

# # Display a summary of the data for verification
# df_summary = {
#     "Incoming Transactions": len(df[df["TransactionType"] == "Incoming"]),
#     "Outgoing Transactions": len(df[df["TransactionType"] == "Outgoing"]),
#     "Total Incoming Amount": df[df["TransactionType"] == "Incoming"]["TransactionAmount"].sum(),
#     "Total Outgoing Amount": df[df["TransactionType"] == "Outgoing"]["TransactionAmount"].sum()
# }

# # Print the summary and DataFrame for verification
# print(df_summary)
# print(df.head())  # Show a preview of the first few rows

# # If you want to check where the CSV is saved, you can print the file path:
# print(f"CSV file saved at: {csv_file_path}")



import pandas as pd
import random
from datetime import datetime, timedelta

# Generate synthetic data
user_id = 1  # Example UserID
num_records = 20  # Set to 20 for both incoming and outgoing

# Function to generate random transaction dates within the last 60 days
def random_date_within_days(days=60):
    start_date = datetime.now() - timedelta(days=days)
    random_date = start_date + timedelta(days=random.randint(0, days))
    return random_date

# Function to generate a random time for each transaction
def random_time():
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return f"{hour:02d}:{minute:02d}:{second:02d}"

# Create synthetic transactions ensuring exactly 20 incoming and 20 outgoing
data = []

# Generate 20 Incoming Transactions
for i in range(num_records):
    # Set amount to 4000 for the 15th of the month (payday), else random between 500 and 2000
    random_date = random_date_within_days(60)
    if random_date.day == 15:
        amount = 3000
    else:
        amount = round(random.uniform(100, 1000), 2)  # More realistic incoming range
    transaction_datetime = random_date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59), second=random.randint(0, 59))
    data.append({
        "UserID": user_id,
        "TransactionID": f"T{2*i+1:04d}",  # Odd numbered IDs for incoming
        "TransactionDate": transaction_datetime.strftime('%Y-%m-%d %H:%M:%S'),
        "TransactionType": "Incoming",
        "TransactionAmount": amount,
        "TransactionHour": transaction_datetime.hour
    })

# Generate 20 Outgoing Transactions
for i in range(num_records):
    amount = round(random.uniform(10, 1000), 2)  # Smaller amounts for outgoing
    random_date = random_date_within_days(60)
    transaction_datetime = random_date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59), second=random.randint(0, 59))
    data.append({
        "UserID": user_id,
        "TransactionID": f"T{2*i+2:04d}",  # Even numbered IDs for outgoing
        "TransactionDate": transaction_datetime.strftime('%Y-%m-%d %H:%M:%S'),
        "TransactionType": "Outgoing",
        "TransactionAmount": amount,
        "TransactionHour": transaction_datetime.hour
    })

# Convert the data to a DataFrame
df = pd.DataFrame(data)

# Ensure the data is sorted by TransactionDate to display in chronological order
df['TransactionDate'] = pd.to_datetime(df['TransactionDate'])
df = df.sort_values(by='TransactionDate')

# Save the DataFrame to a CSV file
csv_file_path = 'chart_data.csv'
df.to_csv(csv_file_path, index=False)

# Display a summary of the data for verification
df_summary = {
    "Incoming Transactions": len(df[df["TransactionType"] == "Incoming"]),
    "Outgoing Transactions": len(df[df["TransactionType"] == "Outgoing"]),
    "Total Incoming Amount": df[df["TransactionType"] == "Incoming"]["TransactionAmount"].sum(),
    "Total Outgoing Amount": df[df["TransactionType"] == "Outgoing"]["TransactionAmount"].sum()
}

# Print the summary and DataFrame for verification
print(df_summary)
print(df.head())  # Show a preview of the first few rows

# If you want to check where the CSV is saved, you can print the file path:
print(f"CSV file saved at: {csv_file_path}")
