from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'python', 'suspicion_model.pkl')
model = joblib.load(model_path)

# Load your transactions data (make sure this path is correct)
transactions_path = os.path.join(script_dir, 'python', 'synthetic_transactions_updated.csv')
transactions_df = pd.read_csv(transactions_path)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    try:
        df = pd.DataFrame([data])
        score = model.decision_function(df)[0]
        prediction = model.predict(df)[0]  # 0 for non-suspicious, 1 for suspicious

        # Ensure we convert the prediction to a boolean
        return jsonify({"score": score, "suspicious": bool(prediction == 1)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/check-suspicion', methods=['POST'])
def check_suspicion():
    user_id = request.json.get('id')
    if not user_id:
        return jsonify({"error": "No user ID provided"}), 400

    # Fetch transactions for the specified user id
    user_transactions = transactions_df[transactions_df['id'] == user_id].copy()  # Use .copy() to avoid SettingWithCopyWarning
    if user_transactions.empty:
        return jsonify({"error": "No transactions found for this user id"}), 404

    # Convert 'TransactionDate' to datetime format for proper comparisons
    user_transactions['TransactionDate'] = pd.to_datetime(user_transactions['TransactionDate'], errors='coerce')

    # Check if 'TransactionDate' has any NaT (Not a Timestamp) values after conversion
    if user_transactions['TransactionDate'].isna().any():
        return jsonify({"error": "Invalid date format in transactions data"}), 500

    # Prepare the features for prediction
    features = ['TransactionFrequency', 'IncomingTransactionAmount', 'OutgoingTransactionAmount',
                'MaxIncomingAmount', 'MaxOutgoingAmount', 'UniqueRecipients', 'TransactionTime', 'JustBelowThreshold']

    if not set(features).issubset(user_transactions.columns):
        return jsonify({"error": "Missing required features in transactions data"}), 500

    X_user = user_transactions[features]

    # Use the trained model to predict if the transactions are suspicious
    predictions = model.predict(X_user)

    # Add the model prediction result to the user_transactions
    user_transactions['PredictedSuspicious'] = predictions

    # Initialize criteria-based checks
    suspicious_count = 0
    score = 0

    # Calculate adaptive thresholds
    incoming_mean = transactions_df['IncomingTransactionAmount'].mean()
    incoming_std = transactions_df['IncomingTransactionAmount'].std()
    outgoing_mean = transactions_df['OutgoingTransactionAmount'].mean()
    outgoing_std = transactions_df['OutgoingTransactionAmount'].std()

    # Set adaptive thresholds (mean + 2 * std deviation)
    large_incoming_threshold = incoming_mean + 2 * incoming_std
    large_outgoing_threshold = outgoing_mean + 2 * outgoing_std
    unique_senders_threshold = 3
    short_period = pd.Timedelta(hours=2)

    # Check criteria-based conditions
    suspicious_criteria_count = 0
    for _, transaction in user_transactions.iterrows():
        transaction_time = transaction['TransactionDate']

        # Check for large incoming amounts
        recent_incoming = user_transactions[
            (user_transactions['TransactionDate'] >= transaction_time - short_period) &
            (user_transactions['IncomingTransactionAmount'] >= large_incoming_threshold)
        ]
        if not recent_incoming.empty:
            suspicious_criteria_count += 1
            score += 1

        # Check for large outgoing amounts
        recent_outgoing = user_transactions[
            (user_transactions['TransactionDate'] >= transaction_time - short_period) &
            (user_transactions['OutgoingTransactionAmount'] >= large_outgoing_threshold)
        ]
        if not recent_outgoing.empty:
            suspicious_criteria_count += 1
            score += 1

        # Check for multiple incoming transactions from unique accounts
        recent_transactions = user_transactions[user_transactions['TransactionDate'] >= transaction_time - short_period]
        unique_senders = recent_transactions['id'].nunique()

        if unique_senders > unique_senders_threshold:
            suspicious_criteria_count += 1
            score += 1

    # Combine model-based suspicion and criteria-based suspicion
    suspicious_count = suspicious_criteria_count + sum(predictions)
    overall_suspicious = suspicious_count > 0

    # Convert all values to native Python types for JSON serialization
    return jsonify({
        "user_id": user_id,
        "suspicious_count": int(suspicious_count),
        "score": int(score),
        "total_transactions": int(len(user_transactions)),
        "overall_suspicious": bool(overall_suspicious),
        "criteria_suspicious_count": int(suspicious_criteria_count),
        "model_suspicious_count": int(sum(predictions)),
        "adaptive_thresholds": {
            "large_incoming": float(large_incoming_threshold),
            "large_outgoing": float(large_outgoing_threshold),
            "unique_senders": int(unique_senders_threshold)
        }
    })
wait_time_model_path = os.path.join(script_dir, 'python', 'Time', 'atm_wait_time_model.pkl')
wait_time_model = joblib.load(wait_time_model_path)

wait_time_path = os.path.join(script_dir, 'python', 'Time','synthetic_atm_data.csv')
wait_time_df = pd.read_csv(wait_time_path)

import numpy as np 

@app.route('/predict-wait-time', methods=['POST'])
def predict_wait_time():
    # Get the input data from the request
    data = request.get_json()

    # Extract ATMID, DayOfWeek, and TimeOfDay
    atm_id = data.get('ATMID')
    day_of_week = data.get('DayOfWeek')
    time_of_day = data.get('TimeOfDay')

    # Check for missing parameters
    if not atm_id or not day_of_week or not time_of_day:
        return jsonify({"error": "ATMID, DayOfWeek, and TimeOfDay are required"}), 400

    # Fetch the relevant data from the synthetic dataset based on ATMID, DayOfWeek, and TimeOfDay
    relevant_data = wait_time_df[
        (wait_time_df['ATMID'] == atm_id) & 
        (wait_time_df['DayOfWeek'] == day_of_week) & 
        (wait_time_df['TimeOfDay'] == time_of_day)
    ]

    # If no data exists for the given parameters, return an error message
    if relevant_data.empty:
        return jsonify({"error": "No historical data available for this ATM and time"}), 404

    # Prepare the features for prediction (removed WithdrawalCount and DepositCount)
    features = ['TransactionVolume', 'InPeakHours', 'AverageQueueLength']

    # Ensure the required features are present in the data
    if not set(features).issubset(relevant_data.columns):
        return jsonify({"error": "Missing required features in the data"}), 500

    # Add the missing features (IsPublicHoliday, WeatherCondition) if they don't exist in the data
    aggregated_features = relevant_data[features].mean().to_dict()
    
    # Add missing features (use default values or logic to set)
    missing_features = ['IsPublicHoliday', 'WeatherCondition']
    for feature in missing_features:
        aggregated_features[feature] = 0  # Default value for missing features (0 for IsPublicHoliday and 0 for WeatherCondition)

    # Add the 'Week' feature (if needed, use a default value like 1 or another logic based on context)
    aggregated_features['Week'] = 1  # Defaulting to Week 1, or add logic based on historical data if needed

    # Include ATMID, DayOfWeek, and TimeOfDay
    aggregated_features['ATMID'] = atm_id
    aggregated_features['DayOfWeek'] = day_of_week
    aggregated_features['TimeOfDay'] = time_of_day

    # Create a DataFrame with the aggregated features
    input_df = pd.DataFrame([aggregated_features])

    # Predict the wait time using the trained model
    try:
        predicted_wait_time = wait_time_model.predict(input_df)[0]

        input_hash = hash((atm_id, day_of_week, time_of_day)) % (2**32)
        np.random.seed(input_hash) 
        # Add controlled noise to make the range wider
        noise_factor = np.random.uniform(-1.5, 1.5)  # Larger noise range
        predicted_wait_time = max(2, min(10, predicted_wait_time + noise_factor))

        if predicted_wait_time > 7:
            predicted_wait_time -= 0.5  # Decrease by 0.5 if above 7
        elif predicted_wait_time > 6:
            adjustment = np.random.uniform(0.2, 0.3)  # Decrease by 0.2–0.3 if above 6
            predicted_wait_time -= adjustment

        # Ensure the final value is within the allowed range
        predicted_wait_time = max(2, min(10, predicted_wait_time))

    except Exception as e:
        print("Model Prediction Error:", e)  # Log the error to console
        return jsonify({"error": str(e)}), 500

    # Return the prediction along with the aggregated features for reference
    return jsonify({
        "ATMID": atm_id,
        "DayOfWeek": day_of_week,
        "TimeOfDay": time_of_day,
        "predicted_wait_time": predicted_wait_time,
        "aggregated_data": aggregated_features
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
