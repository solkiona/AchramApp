package com.achrams.ride1;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Re-apply adjustPan AFTER Capacitor sets up edge-to-edge
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    }
}

// package com.achrams.ride1;

// import com.getcapacitor.BridgeActivity;

// public class MainActivity extends BridgeActivity {}
