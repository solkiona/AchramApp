// In MainActivity.java - detect version and apply accordingly
package com.achrams.ride1;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ (API 30+) — fixes Capacitor 7 edge-to-edge black box
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
        } else {
            // Android 10 and below — let the system resize naturally
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        }
    }
}


// package com.achrams.ride1;

// import android.os.Bundle;
// import android.view.WindowManager;
// import com.getcapacitor.BridgeActivity;

// public class MainActivity extends BridgeActivity {
//     @Override
//     protected void onCreate(Bundle savedInstanceState) {
//         super.onCreate(savedInstanceState);
//         // Re-apply adjustPan AFTER Capacitor sets up edge-to-edge
//         getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
//     }
// }

// package com.achrams.ride1;

// import com.getcapacitor.BridgeActivity;

// public class MainActivity extends BridgeActivity {}
