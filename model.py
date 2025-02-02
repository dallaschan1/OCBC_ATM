import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error

# Load the dataset
file_path = r"S:\FSDP LATEST\OCBC_ATM\atm_synthetic_data.csv"
df = pd.read_csv(file_path)

# Drop non-numeric columns that are not useful for training
df.drop(columns=['name', 'location'], inplace=True)

# Prepare features and target
X = df.drop(columns=['balance_next_day'])  # Features
y = df['balance_next_day']  # Target (label)

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the XGBoost model
model = XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
model.fit(X_train, y_train)

# Evaluate the model
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f'Mean Absolute Error: {mae}')

# Save the trained model
joblib.dump(model, 'xgboost_atm_model.pkl')
print("Model saved as xgboost_atm_model.pkl")
