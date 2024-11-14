package sg.edu.np.mad.atm;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class dashboard extends AppCompatActivity {
    private static final String PREFS_NAME = "UserPreferences";
    private static final String KEY_USER_ID = "userId";
    private static final String KEY_USER_NAME = "userName";
    private static final String KEY_USER_NRIC = "userNric";
    private static final String KEY_USER_TOKEN = "userToken";
    private static final String KEY_USER_BALANCE = "userBalance";
    private SharedPreferences sharedPreferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_dashboard);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize SharedPreferences
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // Retrieve user data from SharedPreferences
        String userId = sharedPreferences.getString(KEY_USER_ID, "N/A");
        String userName = sharedPreferences.getString(KEY_USER_NAME, "N/A");
        String userNric = sharedPreferences.getString(KEY_USER_NRIC, "N/A");
        String userToken = sharedPreferences.getString(KEY_USER_TOKEN, "N/A");
        String userBalance = sharedPreferences.getString(KEY_USER_BALANCE, "N/A");

        TextView textViewUserId = findViewById(R.id.textViewUserId);
        TextView textViewUserName = findViewById(R.id.textViewUserName);
        TextView textViewUserNric = findViewById(R.id.textViewUserNric);
        TextView textViewUserToken = findViewById(R.id.textViewUserToken);
        TextView textViewUserBalance = findViewById(R.id.textViewUserBalance);
        TextView username = findViewById(R.id.accountName);

        textViewUserId.setText("User ID: " + userId);
        textViewUserName.setText("User Name: " + userName);
        username.setText(userName);
        textViewUserNric.setText("User NRIC: " + userNric);
        textViewUserToken.setText("User Token: " + userToken);
        textViewUserBalance.setText("User Balance: " + userBalance);

        CardView card = findViewById(R.id.cardbutton);
        card.setOnClickListener(v -> {
            Intent intent = new Intent(dashboard.this, QRCode.class);
            startActivity(intent);
        });

        ImageView notificationButton = findViewById(R.id.notificationButton);
        notificationButton.setOnClickListener(v -> {
            Intent intent = new Intent(dashboard.this, Notifications.class);
            startActivity(intent);
        });

    }
}