package sg.edu.np.mad.atm;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import java.io.IOException;

public class Feedback extends AppCompatActivity {

    private EditText feedbackInput;
    private Button submitButton;
    private OkHttpClient client;
    private String userId;
    private int rating;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_feedback);

        // Try to retrieve the rating from the Intent
        rating = getIntent().getIntExtra("userRating", -1);
        Log.d("FeedbackActivity", "Rating from Intent: " + rating);  // Log the rating from Intent

        // If rating is not passed via Intent, check SharedPreferences as fallback
        if (rating == -1) {
            SharedPreferences sharedPreferences = getSharedPreferences("UserPreferences", Context.MODE_PRIVATE);
            rating = sharedPreferences.getInt("userRating", 0);  // Default to 0 if not found
            Log.d("FeedbackActivity", "Rating from SharedPreferences: " + rating);  // Log the rating from SharedPreferences
        }

        Log.d("FeedbackActivity", "Final Retrieved Rating: " + rating);

        // Initialize other views and variables
        TextView backButton = findViewById(R.id.backButton);
        backButton.setOnClickListener(v -> onBackPressed());

        feedbackInput = findViewById(R.id.feedbackInput);
        submitButton = findViewById(R.id.submitButton);

        // Retrieve user data from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences("UserPreferences", Context.MODE_PRIVATE);
        userId = sharedPreferences.getString("userId", "N/A");

        client = new OkHttpClient();

        submitButton.setOnClickListener(v -> {
            String feedbackText = feedbackInput.getText().toString();
            if (!feedbackText.isEmpty()) {
                submitFeedback(feedbackText);
            } else {
                Toast.makeText(Feedback.this, "Please enter your feedback", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Method to send feedback to the server
    private void submitFeedback(String feedbackText) {
        String submitUrl = "http://172.20.10.2:3001/submit-feedback";
        String jsonPayload = "{ \"userId\": \"" + userId + "\", \"rating\": " + rating + ", \"feedback\": \"" + feedbackText + "\" }";

        RequestBody requestBody = RequestBody.create(
                MediaType.parse("application/json; charset=utf-8"),
                jsonPayload
        );

        Request request = new Request.Builder()
                .url(submitUrl)
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(Feedback.this, "Failed to submit feedback", Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    runOnUiThread(() -> {
                        Toast.makeText(Feedback.this, "Feedback submitted successfully", Toast.LENGTH_SHORT).show();

                        // Save the processed notification rating value to SharedPreferences
                        SharedPreferences sharedPreferences = getSharedPreferences("ProcessedNotifications", Context.MODE_PRIVATE);
                        SharedPreferences.Editor editor = sharedPreferences.edit();
                        editor.putInt("processedRating_" + rating, rating);  // Save the ratingValue
                        editor.apply();

                        // Send a broadcast to remove the notification
                        Intent intent = new Intent("REMOVE_NOTIFICATION");
                        intent.putExtra("ratingValue", rating);
                        sendBroadcast(intent);

                        finish(); // Close the feedback activity
                    });
                } else {
                    runOnUiThread(() -> Toast.makeText(Feedback.this, "Error submitting feedback", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }
}
