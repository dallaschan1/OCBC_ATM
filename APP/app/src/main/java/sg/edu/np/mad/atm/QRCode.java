package sg.edu.np.mad.atm;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

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
    private static final String WITHDRAW_URL = "http://192.168.18.70:3001/generate-qr";
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
    }

    private void sendWithdrawalRequest() {
        String amount = amountEditText.getText().toString();

        if (amount.isEmpty()) {
            Toast.makeText(this, "Please enter an amount", Toast.LENGTH_SHORT).show();
            return;
        }

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("amount", amount);
            jsonObject.put("userId", sharedPreferences.getString(KEY_USER_ID, ""));
        } catch (JSONException e) {
            e.printStackTrace();
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
}