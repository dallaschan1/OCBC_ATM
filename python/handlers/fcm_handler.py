from firebase_admin import messaging
from flask import jsonify

def send_fcm_message(data):
    registration_token = data.get('token')  # Extract the token sent in the request body
    location = data.get('location')

    if not registration_token:
        return jsonify({"error": "Token not provided"}), 400
    
    location_message = f"Location: {location['lat']}, {location['lng']}"

    # Create the message to send
    message = messaging.Message(
        data={
            'triggerBiometrics': 'true'  # Data payload to trigger biometrics
        },
        notification=messaging.Notification(
            title='Login Request',
            body=location_message  # Include the location in the notification body
        ),
        token=registration_token
    )

    try:
        # Send the message via FCM
        response = messaging.send(message)
        return jsonify({"success": True, "response": response}), 200
    except Exception as e:
        print(f"Error sending message: {e}")
        return jsonify({"success": False, "error": str(e)}), 500