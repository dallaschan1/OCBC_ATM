# print("Starting Flask application...")
# from flask import Flask, request, jsonify
# import joblib
# import pandas as pd

# app = Flask(__name__)
# model = joblib.load('C:/Ngee Ann/Y2 SEM2/FDSP/OCBC_ATM/python/suspicion_model.pkl')
# # Load your trained model

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

    suspicious_count = 0
    total_transactions = len(user_transactions)
    transaction_data = user_transactions[['TransactionFrequency', 'AverageTransactionAmount', 'MaxTransactionAmount', 'UniqueRecipients', 'TransactionTime', 'JustBelowThreshold']].to_dict(orient='records')

    # Get predictions for all transactions
    for transaction in transaction_data:
        df_transaction = pd.DataFrame([transaction])
        score = model.decision_function(df_transaction)[0]
        prediction = model.predict(df_transaction)[0]
        if prediction == 1:
            suspicious_count += 1

    # Adaptive threshold
    mean_transactions = total_transactions / 2
    std_dev_threshold = total_transactions * 0.1
    adaptive_threshold = mean_transactions + std_dev_threshold

    # Determine overall suspicion
    overall_suspicious = suspicious_count > adaptive_threshold

    return jsonify({
        "user_id": user_id,
        "suspicious_count": suspicious_count,
        "total_transactions": total_transactions,
        "overall_suspicious": overall_suspicious,
        "adaptive_threshold": adaptive_threshold
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
