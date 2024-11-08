# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.svm import SVC
# from sklearn.metrics import classification_report
# import joblib

# # Load the synthetic data
# df = pd.read_csv('synthetic_transactions_updated.csv')

# # Separate features and target variable
# X = df[['TransactionFrequency', 'AverageTransactionAmount', 'MaxTransactionAmount', 'UniqueRecipients', 'TransactionTime', 'JustBelowThreshold']]
# y = df['IsSuspicious']

# # Split the data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# # Train a Support Vector Classifier with balanced class weights
# model = SVC(probability=True, class_weight='balanced')
# model.fit(X_train, y_train)

# # Evaluate the model
# predictions = model.predict(X_test)
# print(classification_report(y_test, predictions))

# # Save the model
# joblib.dump(model, 'suspicion_model.pkl')
# print("Model trained and saved as 'suspicion_model.pkl'.")


import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import classification_report
import joblib

# Load the synthetic data
df = pd.read_csv('synthetic_transactions_updated.csv')

# Separate features and target variable
X = df[['TransactionFrequency', 'IncomingTransactionAmount', 'OutgoingTransactionAmount',
         'MaxIncomingAmount', 'MaxOutgoingAmount', 'UniqueRecipients', 'TransactionTime', 'JustBelowThreshold']]
y = df['IsSuspicious']

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Train a Support Vector Classifier with balanced class weights
model = SVC(probability=True, class_weight='balanced')
model.fit(X_train, y_train)

# Evaluate the model
predictions = model.predict(X_test)
print(classification_report(y_test, predictions))

# Save the model
joblib.dump(model, 'suspicion_model.pkl')
print("Model trained and saved as 'suspicion_model.pkl'.")
