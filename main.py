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

#     suspicious_count = 0
#     total_transactions = len(user_transactions)
#     transaction_data = user_transactions[['TransactionFrequency', 'AverageTransactionAmount', 'MaxTransactionAmount', 'UniqueRecipients', 'TransactionTime', 'JustBelowThreshold']].to_dict(orient='records')

#     # Get predictions for all transactions
#     for transaction in transaction_data:
#         df_transaction = pd.DataFrame([transaction])
#         score = model.decision_function(df_transaction)[0]
#         prediction = model.predict(df_transaction)[0]
#         if prediction == 1:
#             suspicious_count += 1

#     # Adaptive threshold
#     mean_transactions = total_transactions / 2
#     std_dev_threshold = total_transactions * 0.1
#     adaptive_threshold = mean_transactions + std_dev_threshold

#     # Determine overall suspicion
#     overall_suspicious = suspicious_count > adaptive_threshold

#     return jsonify({
#         "user_id": user_id,
#         "suspicious_count": suspicious_count,
#         "total_transactions": total_transactions,
#         "overall_suspicious": overall_suspicious,
#         "adaptive_threshold": adaptive_threshold
#     })

# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5000)



print("Starting Flask application...")
from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)
model = joblib.load('C:/Ngee Ann/Y2 SEM2/FDSP/OCBC_ATM/python/suspicion_model.pkl')

# Load your transactions data (make sure this path is correct)
transactions_df = pd.read_csv('C:/Ngee Ann/Y2 SEM2/FDSP/OCBC_ATM/python/synthetic_transactions_updated.csv')

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
    user_transactions = transactions_df[transactions_df['id'] == user_id]
    if user_transactions.empty:
        return jsonify({"error": "No transactions found for this user id"}), 404

    # Calculate adaptive thresholds based on all transactions
    incoming_mean = transactions_df['IncomingTransactionAmount'].mean()
    incoming_std = transactions_df['IncomingTransactionAmount'].std()
    outgoing_mean = transactions_df['OutgoingTransactionAmount'].mean()
    outgoing_std = transactions_df['OutgoingTransactionAmount'].std()

    # Set adaptive thresholds (e.g., mean + 2 * std deviation)
    large_incoming_threshold = incoming_mean + 2 * incoming_std
    large_outgoing_threshold = outgoing_mean + 2 * outgoing_std

    # You can also define unique senders threshold as a variable
    unique_senders_threshold = 3  # or calculate it dynamically

    # Define short period (you can adjust the hours as needed)
    short_period = pd.Timedelta(hours=2)  # Define what is considered a "short period"

    suspicious_count = 0
    score = 0
    total_transactions = len(user_transactions)

    # Check for criteria
    user_transactions.loc[:, 'TransactionDate'] = pd.to_datetime(user_transactions['TransactionDate'])

    # Check for suspicious criteria
    for i in range(total_transactions):
        transaction_time = user_transactions['TransactionDate'].iloc[i]

        # Check for large incoming amounts
        recent_incoming = user_transactions[
            (user_transactions['TransactionDate'] >= transaction_time - short_period) &
            (user_transactions['IncomingTransactionAmount'] >= large_incoming_threshold)
        ]
        if not recent_incoming.empty:
            suspicious_count += 1
            score += 1

        # Check for large outgoing amounts
        recent_outgoing = user_transactions[
            (user_transactions['TransactionDate'] >= transaction_time - short_period) &
            (user_transactions['OutgoingTransactionAmount'] >= large_outgoing_threshold)
        ]
        if not recent_outgoing.empty:
            suspicious_count += 1
            score += 1

        # Check for multiple incoming transactions from unique accounts
        recent_transactions = user_transactions[
            user_transactions['TransactionDate'] >= transaction_time - short_period
        ]
        unique_senders = recent_transactions['id'].nunique()  # Count unique accounts

        if unique_senders > unique_senders_threshold:
            suspicious_count += 1
            score += 1 

    overall_suspicious = suspicious_count > 0  # If any criteria are met

    return jsonify({
        "user_id": user_id,
        "suspicious_count": suspicious_count,
        "score": score,
        "total_transactions": total_transactions,
        "overall_suspicious": overall_suspicious,
        "adaptive_thresholds": {
            "large_incoming": large_incoming_threshold,
            "large_outgoing": large_outgoing_threshold,
            "unique_senders": unique_senders_threshold
        }
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
