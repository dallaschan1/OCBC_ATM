package sg.edu.np.mad.atm;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.Button;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class login extends AppCompatActivity {
//    private static final String LOGIN_URL = "http://192.168.18.70:3001/login";
    private static final String LOGIN_URL = "https://1219-116-88-162-192.ngrok-free.app/login";
    private static final String PREFS_NAME = "UserPreferences";
    private static final String KEY_USER_ID = "userId";
    private static final String KEY_USER_NAME = "userName";
    private static final String KEY_USER_NRIC = "userNric";
    private static final String KEY_USER_TOKEN = "userToken";
    private static final String KEY_USER_BALANCE = "userBalance";
    private EditText nricEditText, passwordEditText;
    private OkHttpClient client;
    private SharedPreferences sharedPreferences;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_login);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        TextView signupText = findViewById(R.id.signUpText);
        signupText.setOnClickListener(v -> {
            Intent intent = new Intent(login.this, RegistrationActivity.class);
            startActivity(intent);
        });

        client = new OkHttpClient();
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        nricEditText = findViewById(R.id.nricInput);
        passwordEditText = findViewById(R.id.passwordInput);
        Button loginButton = findViewById(R.id.loginButton);

        loginButton.setOnClickListener(v -> loginUser());
    }

    private void loginUser() {
        String nric = nricEditText.getText().toString();
        String PasswordHash = passwordEditText.getText().toString();

        // Validate inputs
        if (nric.isEmpty() || PasswordHash.isEmpty()) {
            Toast.makeText(this, "Please enter both NRIC and password", Toast.LENGTH_SHORT).show();
            return;
        }

        // Create JSON body for POST request
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("nric", nric);
            jsonObject.put("PasswordHash", PasswordHash);
        } catch (Exception e) {
            e.printStackTrace();
        }

        RequestBody body = RequestBody.create(
                jsonObject.toString(),
                MediaType.get("application/json; charset=utf-8")
        );

        // Build request
        Request request = new Request.Builder()
                .url(LOGIN_URL)
                .post(body)
                .build();

        // Send request
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(login.this, "Login failed", Toast.LENGTH_SHORT).show());
                Log.e("LoginError", "Network error", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseData = response.body().string();
                    try {
                        JSONObject jsonResponse = new JSONObject(responseData);
                        JSONObject user = jsonResponse.getJSONObject("user");

                        // Retrieve user data from the JSON response
                        String userId = user.getString("UserID");
                        String userName = user.getString("UserName");
                        String userNric = user.getString("nric");
                        String userToken = user.getString("token");
                        String userBalance = user.getString("balance");

                        // Store user data in SharedPreferences
                        SharedPreferences.Editor editor = sharedPreferences.edit();
                        editor.putString(KEY_USER_ID, userId);
                        editor.putString(KEY_USER_NAME, userName);
                        editor.putString(KEY_USER_NRIC, userNric);
//                        editor.putString(KEY_USER_TOKEN, userToken);
                        editor.putString(KEY_USER_BALANCE, userBalance);
                        editor.apply();

                        Log.d("LoginSuccess", "User ID: " + sharedPreferences.getString(KEY_USER_ID, ""));
                        Log.d("LoginSuccess", "User Name: " + sharedPreferences.getString(KEY_USER_NAME, ""));
                        Log.d("LoginSuccess", "User NRIC: " + sharedPreferences.getString(KEY_USER_NRIC, ""));
//                        Log.d("LoginSuccess", "User Token: " + sharedPreferences.getString(KEY_USER_TOKEN, ""));
                        Log.d("LoginSuccess", "User Balance: " + sharedPreferences.getString(KEY_USER_BALANCE, ""));

                        Intent intent = new Intent(login.this, dashboard.class);
                        startActivity(intent);

                        runOnUiThread(() -> Toast.makeText(login.this, "Login successful", Toast.LENGTH_SHORT).show());

                    } catch (JSONException e) {
                        Log.e("LoginError", "Parsing error", e);
                    }
                } else {
                    runOnUiThread(() -> Toast.makeText(login.this, "Invalid credentials", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }
}