package sg.edu.np.mad.atm;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class RegistrationActivity extends AppCompatActivity {

    private static final String TAG = "RegistrationActivity";
    private static final String SERVER_URL = "http://192.168.18.70:3001/register";
    //private static final String SERVER_URL = "https://26d8-2406-3003-2005-3fc7-59f4-44fa-5bb4-31f1.ngrok-free.app/register";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_registration);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        EditText nricInput = findViewById(R.id.nricInput);
        EditText passwordInput = findViewById(R.id.passwordInput);
        Button registerButton = findViewById(R.id.registerButton);
        TextView logintext = findViewById(R.id.loginText);

        registerButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String nric = nricInput.getText().toString().trim();
                String password = passwordInput.getText().toString().trim();

                if (nric.isEmpty() || password.isEmpty()) {
                    Log.d(TAG, "NRIC or Password is empty.");
                    return;
                }

                // Get the FCM Token
                FirebaseMessaging.getInstance().getToken()
                        .addOnCompleteListener(task -> {
                            if (!task.isSuccessful()) {
                                Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                                return;
                            }

                            String token = task.getResult();
                            Log.d(TAG, "FCM Token: " + token);

                            // Send NRIC and Token to the backend
                            registerUser(nric, password, token);
                        });
            }
        });


        logintext.setOnClickListener(v -> {
            Intent intent = new Intent(RegistrationActivity.this, login.class);
            startActivity(intent);
        });
    }

    private void registerUser(String nric, String password, String token) {
        OkHttpClient client = new OkHttpClient();

        try {
            JSONObject json = new JSONObject();
            json.put("nric", nric);
            json.put("password", password); // This is not used in current backend but might be useful for future logic
            json.put("token", token);

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json"));

            Request request = new Request.Builder()
                    .url(SERVER_URL)
                    .post(body)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Failed to register user", e);
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "User registered successfully: " + response.body().string());
                        // You can navigate back to MainActivity or show a success message here
                    } else {
                        Log.e(TAG, "Registration failed: " + response.message());
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error creating JSON for registration", e);
        }
    }
}
