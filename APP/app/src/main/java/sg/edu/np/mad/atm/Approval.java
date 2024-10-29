package sg.edu.np.mad.atm;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.text.DecimalFormat;

public class Approval extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_approval);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        double amount = getIntent().getDoubleExtra("amount", 0.0);

        TextView successMessageTextView = findViewById(R.id.successMessageTextView);
        DecimalFormat decimalFormat = new DecimalFormat("#0.00");
        String formattedAmount = decimalFormat.format(amount);
        successMessageTextView.setText("Successfully withdrawn: SGD " + formattedAmount);

        Button home = findViewById(R.id.Homebtn);
        home.setOnClickListener(v -> {
            Intent intent = new Intent(Approval.this, dashboard.class);
            startActivity(intent);
        });
    }
}