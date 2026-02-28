package com.dressindex.app;

import android.os.Bundle;
import android.view.Window;
import android.webkit.ValueCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyStatusBarTheme(false); // default dark on launch
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "(function(){" +
                "  var t = localStorage.getItem('dressindex_theme') || 'auto';" +
                "  if (t === 'light') return 'light';" +
                "  if (t === 'dark') return 'dark';" +
                "  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';" +
                "})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (value != null) {
                            boolean isLight = value.replace("\"", "").equals("light");
                            runOnUiThread(() -> applyStatusBarTheme(isLight));
                        }
                    }
                }
            );
        }
    }

    private void applyStatusBarTheme(boolean isLight) {
        Window window = getWindow();
        int color = isLight ? 0xFFEDEDED : 0xFF0A0A0A;
        window.setStatusBarColor(color);
        window.setNavigationBarColor(color);

        WindowInsetsControllerCompat insetsController =
            WindowCompat.getInsetsController(window, window.getDecorView());
        insetsController.setAppearanceLightStatusBars(isLight);
        insetsController.setAppearanceLightNavigationBars(isLight);
    }
}
