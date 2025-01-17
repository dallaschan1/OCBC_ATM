package sg.edu.np.mad.atm;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import org.jetbrains.annotations.NotNull;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class WalletTransfer extends AppCompatActivity {

    private EditText inputAmount;
    private EditText inputRecipient;
    private Button btnReceive;

    private final OkHttpClient client = new OkHttpClient();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_wallet_transfer);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize input fields and button
        inputAmount = findViewById(R.id.inputAmount);
        btnReceive = findViewById(R.id.btnProceed);  // Initialize the receive button

        // Set click listener for the receive button (for receiving tokens)
        btnReceive.setOnClickListener(v -> initiateReceiveTokens());
    }

    private void initiateReceiveTokens() {
        String amount = inputAmount.getText().toString();

        // Basic validation
        if (amount.isEmpty()) {
            Toast.makeText(this, "Please enter an amount", Toast.LENGTH_SHORT).show();
            return;
        }

        // Hardcoded wallet address
        String walletAddress = "0xa6D157b342d46D91d0645b93301190e01e3fC956";

        // Construct JSON payload for receiving tokens
        String jsonPayload = String.format("{\"walletAddress\":\"%s\", \"amount\":\"%s\", \"tokenName\":\"Bitcoin\"}", walletAddress, amount);

        // Call the /receive endpoint (sending tokens back)
        postRequest("http://172.20.10.2:3001/receive", jsonPayload);
    }

    private void postRequest(String url, String json) {
        MediaType JSON = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                runOnUiThread(() -> Toast.makeText(WalletTransfer.this, "Request Failed", Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                if (response.isSuccessful()) {
                    runOnUiThread(() -> Toast.makeText(WalletTransfer.this, "Transfer Successful", Toast.LENGTH_SHORT).show());
                } else {
                    String responseBody = response.body() != null ? response.body().string() : "No response body";
                    runOnUiThread(() -> Toast.makeText(WalletTransfer.this, "Transfer Failed: " + responseBody, Toast.LENGTH_SHORT).show());
                }
            }
        });
    }
}
