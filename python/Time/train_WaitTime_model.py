############################################################################################################
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib

# Load the synthetic data
df = pd.read_csv("python/Time/synthetic_atm_data.csv")

# Define the features (all columns except the target)
features = [
    "ATMID", "Week", "DayOfWeek", "TimeOfDay", "TransactionVolume", 
    "WeatherCondition", "IsPublicHoliday", "InPeakHours", "AverageQueueLength"
]

# Target variable (WaitTime)
target = "WaitTime"

# Split the data into features (X) and target (y)
X = df[features]
y = df[target]

# Split into training and testing sets (80% training, 20% testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Set up a pipeline with a column transformer and random forest regressor
pipeline = Pipeline([
    ("preprocessor", ColumnTransformer(
        transformers=[("num", StandardScaler(), X.columns)]
    )),
    ("model", RandomForestRegressor(
        n_estimators=200,      # Fewer trees
        max_depth=30,           
        min_samples_split=2,   # Larger min_samples_split
        random_state=42,        
        max_features="sqrt",    
        n_jobs=-1               
    ))  
])

# Train the model
pipeline.fit(X_train, y_train)

# Predict on the test set
y_pred = pipeline.predict(X_test)

# Add some noise to make predictions more variable
noise_factor = np.random.uniform(-0.01, 0.01, size=y_pred.shape)  # Wider range of noise
y_pred_noisy = y_pred + noise_factor

# Clip the noisy predictions to a reasonable range (e.g., 2 to 10 minutes for WaitTime)
y_pred_noisy = np.clip(y_pred_noisy, 2, 10)

# Evaluate the model
mae = mean_absolute_error(y_test, y_pred_noisy)
mse = mean_squared_error(y_test, y_pred_noisy)
rmse = mse ** 0.5

print(f"Mean Absolute Error: {mae:.2f}")
print(f"Root Mean Squared Error: {rmse:.2f}")

# Optionally, save the model for later use
joblib.dump(pipeline, "python/Time/atm_wait_time_model.pkl")
print("Model saved to 'atm_wait_time_model.pkl'")