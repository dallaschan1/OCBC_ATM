package sg.edu.np.mad.atm;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class QRCode extends AppCompatActivity {
    private static final String PREFS_NAME = "UserPreferences";
    private static final String KEY_USER_ID = "userId";
    private static final String KEY_USER_NAME = "userName";
    private static final String KEY_USER_NRIC = "userNric";
    private static final String KEY_USER_BALANCE = "userBalance";
    private static final String WITHDRAW_URL = "http://192.168.18.70:3001/generate-qr"; // endpoint
    private SharedPreferences sharedPreferences;
    private OkHttpClient client;
    private EditText amountEditText;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_qrcode);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        client = new OkHttpClient();
        amountEditText = findViewById(R.id.withdrawAmountInput);

        String userBalance = sharedPreferences.getString(KEY_USER_BALANCE, "N/A");
        TextView balance = findViewById(R.id.balanceText);
        balance.setText("Balance: SGD "+ userBalance);

        Button nextButton = findViewById(R.id.nextButton);
        nextButton.setOnClickListener(v -> {
            sendWithdrawalRequest();
        });

        Button scanButton = findViewById(R.id.scanButton);
        scanButton.setOnClickListener(v -> {
            startQRCodeScanner();
        });
    }

    private void sendWithdrawalRequest() {
        String amount = amountEditText.getText().toString();

        if (amount.isEmpty()) {
            Toast.makeText(this, "Please enter an amount", Toast.LENGTH_SHORT).show();
            return;
        }

        String userNric = sharedPreferences.getString(KEY_USER_NRIC, "");
        checkWebToken(userNric, amount);
    }

    private void checkWebToken(String nric, String amount) {
        // Assuming you have a URL to check for web_token
        String checkTokenUrl = "http://192.168.18.70:3001/get-web-token"; // endpoint

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("nric", nric);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        RequestBody body = RequestBody.create(
                jsonObject.toString(),
                MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
                .url(checkTokenUrl)
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(QRCode.this, "Failed to check token", Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body() != null ? response.body().string() : "null";
                Log.e("QRCode", "Response Code: " + response.code() + ", Body: " + responseBody);
                if (response.isSuccessful()) {
                    sendWithdrawalRequestToServer(amount, sharedPreferences.getString(KEY_USER_ID, ""));
                } else {
                    runOnUiThread(() -> Toast.makeText(QRCode.this, "Not logged in on ATM", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }

    private void sendWithdrawalRequestToServer(String amount, String userId) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("amount", amount);
            jsonObject.put("userId", userId);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        RequestBody body = RequestBody.create(
                jsonObject.toString(),
                MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
                .url(WITHDRAW_URL)
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(QRCode.this, "Failed to send request", Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    runOnUiThread(() -> Toast.makeText(QRCode.this, "QR Code generated on website", Toast.LENGTH_SHORT).show());
                } else {
                    runOnUiThread(() -> Toast.makeText(QRCode.this, "Request failed", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }


    private void startQRCodeScanner() {
        IntentIntegrator integrator = new IntentIntegrator(this);
        integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE);
        integrator.setPrompt("Scan a QR code");
        integrator.setCameraId(0);
        integrator.setBeepEnabled(false);
        integrator.setBarcodeImageEnabled(true);
        integrator.setOrientationLocked(true);
        integrator.setCaptureActivity(PortraitCaptureActivity.class);
        integrator.initiateScan();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            if (result.getContents() == null) {
                Toast.makeText(this, "Cancelled", Toast.LENGTH_SHORT).show();
            } else {
                handleScanResult(result.getContents());
            }
        }
    }

    private void handleScanResult(String scannedData) {
        Toast.makeText(this, "Scanned: " + scannedData, Toast.LENGTH_SHORT).show();

        try {
            JSONObject jsonObject = new JSONObject(scannedData);
            String userId = jsonObject.getString("userId");
            double amountToDeduct = jsonObject.getDouble("amount");

            String balanceString = sharedPreferences.getString(KEY_USER_BALANCE, "0.00");
            double currentBalance = Double.parseDouble(balanceString);

            // Check if the user has sufficient balance
            if (currentBalance >= amountToDeduct) {
                // Deduct balance
                deductBalance(userId, amountToDeduct, currentBalance);
            } else {
                Toast.makeText(this, "Insufficient balance", Toast.LENGTH_SHORT).show();
            }
        } catch (JSONException e) {
            e.printStackTrace();
            Toast.makeText(this, "Invalid QR Code data", Toast.LENGTH_SHORT).show();
        }
    }


    private void deductBalance(String userId, double amount, double currentBalance) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("UserID", userId);
            jsonObject.put("amount", amount);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        RequestBody body = RequestBody.create(
                jsonObject.toString(),
                MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
                .url("http://192.168.18.70:3001/deduct-balance") // endpoint
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> Toast.makeText(QRCode.this, "Failed to send deduction request", Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    // Calculate new balance
                    double newBalance = currentBalance - amount;

                    // Update SharedPreferences with new balance
                    SharedPreferences.Editor editor = sharedPreferences.edit();
                    editor.putString(KEY_USER_BALANCE, String.format("%.2f", newBalance)); // Format to 2 decimal places
                    editor.apply();

                    runOnUiThread(() -> {
                        Toast.makeText(QRCode.this, "Balance deducted successfully", Toast.LENGTH_SHORT).show();

                        // Navigate to the Approval page
                        Intent intent = new Intent(QRCode.this, Approval.class);
                        intent.putExtra("amount", amount);
                        startActivity(intent);
                    });
                } else {
                    runOnUiThread(() -> Toast.makeText(QRCode.this, "Failed to deduct balance", Toast.LENGTH_SHORT).show());
                }
            }
        });
    }

}