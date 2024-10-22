from flask import Flask, request, jsonify, send_from_directory
import firebase_admin
from firebase_admin import credentials
from python.handlers.fcm_handler import send_fcm_message  # Updated import statement
import threading
import time

# Initialize Flask app
app = Flask(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('./atm-app-66706-firebase-adminsdk-fz91r-3355db617f.json')  # Path to your service account key
firebase_admin.initialize_app(cred)


@app.route('/')
def index():
    with open('index.html', 'r') as file:
        return file.read()
    
@app.route('/fingerprint')
def fingerprint():
    with open('./Web/html/fingerprint.html', 'r') as file:
        return file.read()

# Endpoint to send FCM message
@app.route('/send-message', methods=['POST'])
def send_message():
    start_time = time.time()
    
    data = request.get_json()
    response = send_fcm_message(data)  # Call the function from fcm_handler

    end_time = time.time()  # End time
    duration = end_time - start_time
    print(f"Send message duration: {duration:.2f} seconds")
    return response

if __name__ == '__main__':
    app.run(port=5000)
