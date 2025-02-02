package sg.edu.np.mad.atm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import sg.edu.np.mad.atm.Feedback;
import sg.edu.np.mad.atm.R;

public class Notifications extends AppCompatActivity {

    private static final String PREFS_NAME = "UserPreferences";
    private RecyclerView notificationsRecyclerView;
    private List<Notification> notifications;
    private OkHttpClient client;
    private String userId;
    private String userName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_notifications);

        // Retrieve user data from SharedPreferences
        SharedPreferences sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        userId = sharedPreferences.getString("userId", "N/A");
        userName = sharedPreferences.getString("userName", "User");

        // Toolbar back button functionality
        TextView backButton = findViewById(R.id.backButton);
        backButton.setOnClickListener(v -> onBackPressed());

        // RecyclerView setup
        notificationsRecyclerView = findViewById(R.id.notificationsRecyclerView);
        notificationsRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        // Initialize the notifications list and OkHttp client
        notifications = new ArrayList<>();
        client = new OkHttpClient();

        // Register the receiver to listen for the broadcast
        IntentFilter filter = new IntentFilter("REMOVE_NOTIFICATION");
        registerReceiver(notificationReceiver, filter);

        // Load low ratings (below 3) for the specific user
        loadLowRatings();
    }

    private final BroadcastReceiver notificationReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("REMOVE_NOTIFICATION".equals(intent.getAction())) {
                int ratingValue = intent.getIntExtra("ratingValue", -1);
                if (ratingValue != -1) {
                    // Remove the notification from the list based on rating value
                    removeNotificationByRating(ratingValue);
                }
            }
        }
    };

    private void removeNotificationByRating(int ratingValue) {
        for (int i = 0; i < notifications.size(); i++) {
            Notification notification = notifications.get(i);
            if (notification.getRatingValue() == ratingValue) {
                notifications.remove(i);
                break; // Remove the first matching notification
            }
        }

        // Update the RecyclerView
        runOnUiThread(() -> {
            NotificationsAdapter adapter = new NotificationsAdapter(Notifications.this, notifications);
            notificationsRecyclerView.setAdapter(adapter);
        });
    }


    // Method to load low ratings from the server (ratings < 3)
    private void loadLowRatings() {
      String RatingsUrl = "http://172.20.10.2:3001/get-low-ratings?userId=" + userId;
       // String RatingsUrl = "https://1219-116-88-162-192.ngrok-free.app/get-low-ratings?userId=" + userId;
        Request request = new Request.Builder()
                .url(RatingsUrl)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(Notifications.this, "Error fetching low ratings", Toast.LENGTH_SHORT).show());
                Log.e("NotificationsError", "Network request failed", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseData = response.body().string();
                    Log.d("API Response", responseData);  // Log the response data for debugging

                    try {
                        JSONObject jsonResponse = new JSONObject(responseData);
                        JSONArray ratingArray = jsonResponse.getJSONArray("ratings");

                        // Clear existing notifications and load new ones
                        notifications.clear();

                        // Parse the response data
                        for (int i = 0; i < ratingArray.length(); i++) {
                            JSONObject ratingJson = ratingArray.getJSONObject(i);

                            int ratingValue = ratingJson.getInt("Rating");
                            String ratingDate = ratingJson.getString("RatingDate");

                            // Only add notifications for ratings below 3
                            if (ratingValue < 3) {
                                String title = "Your feedback matters";
                                String message = "Hi " + userName + ", we noticed that you recently gave our ATM experience a rating of " + ratingValue + ". Please provide feedback so we can improve your experience.";
                                String type = "feedback";
                                String time = convertToTimeFormat(ratingDate);
                                notifications.add(0, new Notification(title, message, time, type, ratingValue));
                            }
                        }

                        // Update the RecyclerView on the main thread
                        runOnUiThread(() -> {
                            NotificationsAdapter adapter = (NotificationsAdapter) notificationsRecyclerView.getAdapter();
                            if (adapter == null) {
                                adapter = new NotificationsAdapter(Notifications.this, notifications);
                                notificationsRecyclerView.setAdapter(adapter);
                            } else {
                                adapter.notifyDataSetChanged();
                            }

                        });

                    } catch (Exception e) {
                        e.printStackTrace();
                        runOnUiThread(() -> Toast.makeText(Notifications.this, "Error processing low ratings", Toast.LENGTH_SHORT).show());
                    }
                } else {
                    runOnUiThread(() -> Toast.makeText(Notifications.this, "Failed to load low ratings", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }

    // Method to convert ISO date format to "h:mm a" in local timezone
    private String convertToTimeFormat(String ratingDate) {
        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
        inputFormat.setTimeZone(TimeZone.getTimeZone("Asia/Singapore"));  // Parse as UTC time
        SimpleDateFormat outputFormat = new SimpleDateFormat("h:mm a", Locale.getDefault());
        outputFormat.setTimeZone(TimeZone.getDefault());       // Format as local time

        try {
            Date date = inputFormat.parse(ratingDate);
            return outputFormat.format(date);
        } catch (ParseException e) {
            Log.e("TimeFormatError", "Date parsing failed for: " + ratingDate, e);
            return ""; // Return empty string in case of error
        }
    }

    // Notification data model class with added rating value
    public static class Notification {
        private final String title;
        private final String message;
        private final String time;
        private final String type;
        private final int ratingValue;  // Added field for rating value

        public Notification(String title, String message, String time, String type, int ratingValue) {
            this.title = title;
            this.message = message;
            this.time = time;
            this.type = type;
            this.ratingValue = ratingValue;  // Initialize rating value
        }

        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public String getTime() { return time; }
        public String getType() { return type; }
        public int getRatingValue() { return ratingValue; }  // Getter for rating value
    }

    // RecyclerView Adapter and ViewHolder
    private static class NotificationsAdapter extends RecyclerView.Adapter<NotificationsAdapter.ViewHolder> {
        private final Context context;
        private final List<Notification> notifications;

        public NotificationsAdapter(Context context, List<Notification> notifications) {
            this.context = context;
            this.notifications = notifications;
        }

        @Override
        public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            // Inflate the notification_item layout for each item in the list
            View view = LayoutInflater.from(context).inflate(R.layout.item_notification, parent, false);
            return new ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(ViewHolder holder, int position) {
            Notification notification = notifications.get(position);
            holder.notificationTitle.setText(notification.getTitle());
            holder.notificationMessage.setText(notification.getMessage());
            holder.notificationTime.setText(notification.getTime());

            // Handle click events based on the notification type
            holder.itemView.setOnClickListener(v -> {
                if ("feedback".equals(notification.getType())) {
                    Intent feedbackIntent = new Intent(context, Feedback.class);
                    feedbackIntent.putExtra("userRating", notification.getRatingValue());  // Ensure rating value is correct here
                    context.startActivity(feedbackIntent);
                } else {
                    Toast.makeText(context, "Clicked: " + notification.getTitle(), Toast.LENGTH_SHORT).show();
                }
            });

        }

        @Override
        public int getItemCount() {
            return notifications.size();
        }

        // ViewHolder class to bind views in notification_item.xml
        static class ViewHolder extends RecyclerView.ViewHolder {
            TextView notificationTitle, notificationMessage, notificationTime;

            ViewHolder(View itemView) {
                super(itemView);
                notificationTitle = itemView.findViewById(R.id.notificationTitle);
                notificationMessage = itemView.findViewById(R.id.notificationMessage);
                notificationTime = itemView.findViewById(R.id.notificationTime);
            }
        }
    }
}