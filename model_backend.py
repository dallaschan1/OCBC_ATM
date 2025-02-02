import pandas as pd
import numpy as np
import joblib
from flask import Flask, request, jsonify
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error

app = Flask(__name__)

# ------------------------------------------------------------------------------
# 1. Load the pre-trained model and the CSV data
# ------------------------------------------------------------------------------
model = joblib.load("xgboost_atm_model.pkl")
df = pd.read_csv("atm_synthetic_data.csv")

# Print the feature names for debugging/logging
# (These are the features in the order the model expects them.)
print("Model feature names (from XGBoost):", model.get_booster().feature_names)

# ------------------------------------------------------------------------------
# 2. Define the EXACT feature order the model was trained on
#    (Check your DataFrame columns from the training phase!)
# ------------------------------------------------------------------------------
FEATURE_ORDER = [
    "amount_of_cash_left",
    "max_cash_capacity",
    "avg_daily_withdrawal",
    "transaction_count",
    "last_week_withdrawal",
    "emergency_refill_count",
    "days_since_last_refill",
]

# ------------------------------------------------------------------------------
# 3. Helper function: simulate day-by-day depletion
# ------------------------------------------------------------------------------
def simulate_until_refill(initial_state, max_days=30):
    """
    Simulates ATM cash depletion day by day until it requires a refill.
    If the predicted balance is >= current day's balance,
    subtract 20-40% of the ORIGINAL Day 0 balance from the predicted balance.

    :param initial_state: dict with keys like 'amount_of_cash_left', etc.
    :param max_days: maximum days to simulate
    :return: list of predicted balances for each simulated day
    """
    predictions = []
    current_state = initial_state.copy()

    # 1) Remember the "Day 0" original balance
    original_balance = current_state['amount_of_cash_left']

    for day in range(max_days):
        # 2) Predict next day's balance
        input_df = pd.DataFrame([current_state])[FEATURE_ORDER]
        predicted_balance = float(model.predict(input_df)[0])

        # 3) If it "goes up" or is flat, subtract 20-40% of original_balance
        if predicted_balance >= current_state['amount_of_cash_left']:
            drop_amount = original_balance * np.random.uniform(0.2, 0.5)
            predicted_balance = current_state['amount_of_cash_left'] - drop_amount

        # Ensure balance doesn't go below zero
        predicted_balance = max(predicted_balance, 0)

        # 4) Store the final predicted balance
        predictions.append(predicted_balance)

        # 5) Update 'current_state' for the next iteration
        current_state['amount_of_cash_left'] = predicted_balance
        current_state['days_since_last_refill'] += 1

        # Example: random variance to other features
        current_state['transaction_count'] = int(
            current_state['transaction_count'] * np.random.uniform(0.9, 1.1)
        )
        current_state['avg_daily_withdrawal'] *= np.random.uniform(0.9, 1.1)

        # 6) Stop if the balance is depleted
        if predicted_balance <= 0:
            break

    return predictions



# ------------------------------------------------------------------------------
# 4. /predict endpoint
# ------------------------------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 4a. Grab JSON data from the request body
        data = request.get_json()
        print("Received Data:", data)  # Logging for debugging

        # 4b. Convert incoming data to a DataFrame, reordering columns to match training
        input_df = pd.DataFrame([data])[FEATURE_ORDER]

        # 4c. Run a single prediction
        # Model returns a NumPy type, so cast to Python float
        predicted_balance_single_day = float(model.predict(input_df)[0])

        # 4d. Simulate daily predictions until the ATM depletes or max_days is reached
        predictions_over_time = simulate_until_refill(data)

        # 4e. Calculate margin of error on the entire dataset
        #     Make sure df[FEATURE_ORDER] exists without missing columns
        mae_value = mean_absolute_error(df['balance_next_day'], model.predict(df[FEATURE_ORDER]))

        # 4f. Build the JSON response
        response = {
            'predicted_balance_single_day': predicted_balance_single_day,
            'predicted_balance_over_time': predictions_over_time,  # already cast to float
            'days_until_empty': len(predictions_over_time),
            'margin_of_error': float(round(mae_value, 2))  # cast to float to avoid serialization issues
        }

        return jsonify(response)

    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': str(e)}), 500

# ------------------------------------------------------------------------------
# 5. Main entrypoint
# ------------------------------------------------------------------------------
if __name__ == '__main__':
    # Run the Flask app in debug mode (so you can see errors, etc.)
    app.run(debug=True)
