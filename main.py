# print("Starting Flask application...")
# from flask import Flask, request, jsonify
# import joblib
# import pandas as pd

# app = Flask(__name__)
# model = joblib.load('C:/Ngee Ann/Y2 SEM2/FDSP/OCBC_ATM/python/suspicion_model.pkl')

# # Load your transactions data (make sure this path is correct)
# transactions_df = pd.read_csv('C:/Ngee Ann/Y2 SEM2/FDSP/OCBC_ATM/python/synthetic_transactions_updated.csv')

# @app.route('/predict', methods=['POST'])
# def predict():
#     data = request.json
#     if not data:
#         return jsonify({"error": "No data received"}), 400

#     try:
#         df = pd.DataFrame([data])
#         score = model.decision_function(df)[0]
#         prediction = model.predict(df)[0]  # 0 for non-suspicious, 1 for suspicious

#         # Ensure we convert the prediction to a boolean
#         return jsonify({"score": score, "suspicious": bool(prediction == 1)})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
    

# @app.route('/check-suspicion', methods=['POST'])
# def check_suspicion():
#     user_id = request.json.get('id')
#     if not user_id:
#         return jsonify({"error": "No user ID provided"}), 400

#     # Fetch transactions for the specified user id
#     user_transactions = transactions_df[transactions_df['id'] == user_id]
#     if user_transactions.empty:
#         return jsonify({"error": "No transactions found for this user id"}), 404

#     # Calculate adaptive thresholds based on all transactions
#     incoming_mean = transactions_df['IncomingTransactionAmount'].mean()
#     incoming_std = transactions_df['IncomingTransactionAmount'].std()
#     outgoing_mean = transactions_df['OutgoingTransactionAmount'].mean()
#     outgoing_std = transactions_df['OutgoingTransactionAmount'].std()

#     # Set adaptive thresholds (e.g., mean + 2 * std deviation)
#     large_incoming_threshold = incoming_mean + 2 * incoming_std
#     large_outgoing_threshold = outgoing_mean + 2 * outgoing_std

#     # You can also define unique senders threshold as a variable
#     unique_senders_threshold = 3  # or calculate it dynamically

#     # Define short period (you can adjust the hours as needed)
#     short_period = pd.Timedelta(hours=2)  # Define what is considered a "short period"

#     suspicious_count = 0
#     score = 0
#     total_transactions = len(user_transactions)

#     # Check for criteria
#     user_transactions.loc[:, 'TransactionDate'] = pd.to_datetime(user_transactions['TransactionDate'])

#     # Check for suspicious criteria
#     for i in range(total_transactions):
#         transaction_time = user_transactions['TransactionDate'].iloc[i]

#         # Check for large incoming amounts
#         recent_incoming = user_transactions[
#             (user_transactions['TransactionDate'] >= transaction_time - short_period) &
#             (user_transactions['IncomingTransactionAmount'] >= large_incoming_threshold)
#         ]
#         if not recent_incoming.empty:
#             suspicious_count += 1
#             score += 1

#         # Check for large outgoing amounts
#         recent_outgoing = user_transactions[
#             (user_transactions['TransactionDate'] >= transaction_time - short_period) &
#             (user_transactions['OutgoingTransactionAmount'] >= large_outgoing_threshold)
#         ]
#         if not recent_outgoing.empty:
#             suspicious_count += 1
#             score += 1

#         # Check for multiple incoming transactions from unique accounts
#         recent_transactions = user_transactions[
#             user_transactions['TransactionDate'] >= transaction_time - short_period
#         ]
#         unique_senders = recent_transactions['id'].nunique()  # Count unique accounts

#         if unique_senders > unique_senders_threshold:
#             suspicious_count += 1
#             score += 1 

#     overall_suspicious = suspicious_count > 0  # If any criteria are met

#     return jsonify({
#         "user_id": user_id,
#         "suspicious_count": suspicious_count,
#         "score": score,
#         "total_transactions": total_transactions,
#         "overall_suspicious": overall_suspicious,
#         "adaptive_thresholds": {
#             "large_incoming": large_incoming_threshold,
#             "large_outgoing": large_outgoing_threshold,
#             "unique_senders": unique_senders_threshold
#         }
#     })


# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5000)



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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
