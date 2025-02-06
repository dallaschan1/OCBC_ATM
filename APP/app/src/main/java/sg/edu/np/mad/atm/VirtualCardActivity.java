package sg.edu.np.mad.atm;

import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

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

public class VirtualCardActivity extends AppCompatActivity {
    private static final String NGROK_URL = "https://f0ec-116-88-162-192.ngrok-free.app"; // Replace with your Ngrok URL
    private static final String LOCK_URL = NGROK_URL + "/ATMCardLock";
    private static final String UNLOCK_URL = NGROK_URL + "/ATMCardUnlock";

    private CardView virtualCard;
    private Button lockButton, unlockButton;
    private OkHttpClient client;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_virtual_card);

        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        client = new OkHttpClient();

        virtualCard = findViewById(R.id.virtualCard);
        lockButton = findViewById(R.id.lockButton);
        unlockButton = findViewById(R.id.unlockButton);

        lockButton.setOnClickListener(v -> showPincodeDialog(true));
        unlockButton.setOnClickListener(v -> showPincodeDialog(false));
    }

    private void showPincodeDialog(boolean isLocking) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(isLocking ? "Enter Pincode to Lock" : "Enter Pincode to Unlock");

        // Input field
        final EditText input = new EditText(this);
        input.setHint("Enter your pincode");
        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER | android.text.InputType.TYPE_NUMBER_VARIATION_PASSWORD);

        LinearLayout layout = new LinearLayout(this);
        layout.setPadding(50, 20, 50, 0);
        layout.addView(input);

        builder.setView(layout);

        // Buttons
        builder.setPositiveButton("Confirm", (dialog, which) -> {
            String pincode = input.getText().toString().trim();
            if (pincode.isEmpty()) {
                Toast.makeText(this, "Pincode cannot be empty", Toast.LENGTH_SHORT).show();
            } else {
                showConfirmationDialog(isLocking, pincode);
            }
        });

        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.cancel());

        builder.show();
    }

    private void showConfirmationDialog(boolean isLocking, String pincode) {
        // Confirmation Dialog
        AlertDialog.Builder confirmationBuilder = new AlertDialog.Builder(this);
        confirmationBuilder.setTitle(isLocking ? "Confirm Lock" : "Confirm Unlock");
        confirmationBuilder.setMessage(isLocking ? "Are you sure you want to lock your ATM card?" : "Are you sure you want to unlock your ATM card?");

        confirmationBuilder.setPositiveButton("Yes", (dialog, which) -> {
            // Proceed with the action
            sendCardAction(isLocking ? LOCK_URL : UNLOCK_URL, isLocking, pincode);
        });

        confirmationBuilder.setNegativeButton("No", (dialog, which) -> dialog.cancel());

        confirmationBuilder.show();
    }

    private void sendCardAction(String url, boolean isLocking, String pincode) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("pincode", pincode);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        RequestBody body = RequestBody.create(
                jsonObject.toString(),
                MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    Toast.makeText(VirtualCardActivity.this, "Failed to connect", Toast.LENGTH_SHORT).show();
                    Log.e("VirtualCardError", "Network error", e);
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseData = response.body().string();

                runOnUiThread(() -> {
                    if (response.isSuccessful()) {
                        Toast.makeText(VirtualCardActivity.this, isLocking ? "ATM Card Locked" : "ATM Card Unlocked", Toast.LENGTH_SHORT).show();
                        virtualCard.setCardBackgroundColor(isLocking ? Color.LTGRAY : Color.DKGRAY);
                    } else {
                        Toast.makeText(VirtualCardActivity.this, "Error: " + responseData, Toast.LENGTH_SHORT).show();
                    }
                });

                Log.d("VirtualCardResponse", responseData);
            }
        });
    }
}
