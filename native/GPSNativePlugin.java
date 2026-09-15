package com.lukman.motomonitor;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "GPSNative",
    permissions = {
        @Permission(alias = "location", strings = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        })
    }
)
public class GPSNativePlugin extends Plugin {
    private LocationManager locationManager;
    private LocationListener locationListener;
    private boolean tracking = false;
    private long lastFixAt = 0L;
    private String lastProvider = "";

    @Override
    public void load() {
        locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        locationListener = new LocationListener() {
            @Override public void onLocationChanged(@NonNull Location location) { emitLocation(location); }
            @Override public void onProviderEnabled(@NonNull String provider) { emitStatus("provider_enabled:" + provider); }
            @Override public void onProviderDisabled(@NonNull String provider) { emitStatus("provider_disabled:" + provider); }
            @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
        };
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!hasLocationPermission()) {
            emitStatus("permission_required");
            requestPermissionForAlias("location", call, "permissionCallback");
            return;
        }
        try {
            startTracking();
            call.resolve();
        } catch (SecurityException e) {
            emitStatus("permission_error");
            call.reject("GPS permission error: " + e.getMessage());
        } catch (Exception e) {
            emitStatus("start_error:" + safeMessage(e));
            call.reject("GPS start failed: " + safeMessage(e));
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (!hasLocationPermission()) {
            emitStatus("permission_denied");
            call.reject("Location permission denied");
            return;
        }
        try {
            startTracking();
            call.resolve();
        } catch (SecurityException e) {
            emitStatus("permission_error");
            call.reject("GPS permission error: " + e.getMessage());
        } catch (Exception e) {
            emitStatus("start_error:" + safeMessage(e));
            call.reject("GPS start failed: " + safeMessage(e));
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopTracking();
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject out = new JSObject();
        out.put("permission", hasLocationPermission() ? "granted" : "denied");
        out.put("locationEnabled", isLocationEnabled());
        out.put("gpsExists", hasProvider(LocationManager.GPS_PROVIDER));
        out.put("networkExists", hasProvider(LocationManager.NETWORK_PROVIDER));
        out.put("gpsEnabled", isProviderEnabled(LocationManager.GPS_PROVIDER));
        out.put("networkEnabled", isProviderEnabled(LocationManager.NETWORK_PROVIDER));
        out.put("fusedExists", Build.VERSION.SDK_INT >= 31 && hasProvider(LocationManager.FUSED_PROVIDER));
        out.put("fusedEnabled", Build.VERSION.SDK_INT >= 31 && isProviderEnabled(LocationManager.FUSED_PROVIDER));
        out.put("tracking", tracking);
        out.put("lastFixAt", lastFixAt);
        out.put("lastProvider", lastProvider);
        call.resolve(out);
    }

    private boolean hasLocationPermission() {
        return androidx.core.content.ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || androidx.core.content.ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasProvider(String provider) {
        try { return locationManager != null && locationManager.hasProvider(provider); }
        catch (Exception e) { return false; }
    }

    private boolean isProviderEnabled(String provider) {
        try { return locationManager != null && hasProvider(provider) && locationManager.isProviderEnabled(provider); }
        catch (Exception e) { return false; }
    }

    private boolean isLocationEnabled() {
        if (locationManager == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return locationManager.isLocationEnabled();
        return isProviderEnabled(LocationManager.GPS_PROVIDER) || isProviderEnabled(LocationManager.NETWORK_PROVIDER);
    }

    private void startTracking() {
        if (locationManager == null) throw new IllegalStateException("LocationManager unavailable");
        if (!isLocationEnabled()) {
            emitStatus("location_disabled");
            throw new IllegalStateException("Location services are disabled");
        }
        if (tracking) return;

        boolean registered = false;
        if (isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            requestProvider(LocationManager.GPS_PROVIDER);
            registered = true;
        }
        if (isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            requestProvider(LocationManager.NETWORK_PROVIDER);
            registered = true;
        }
        if (Build.VERSION.SDK_INT >= 31 && isProviderEnabled(LocationManager.FUSED_PROVIDER)) {
            requestProvider(LocationManager.FUSED_PROVIDER);
            registered = true;
        }
        if (!registered) throw new IllegalStateException("No Android location provider is enabled");
        tracking = true;
        emitStatus("tracking_started");
        emitStatus("waiting_for_fix");
    }

    private void requestProvider(String provider) {
        if (Build.VERSION.SDK_INT >= 30) {
            locationManager.requestLocationUpdates(provider, 1000L, 0f, getContext().getMainExecutor(), locationListener);
            try {
                locationManager.getCurrentLocation(provider, null, getContext().getMainExecutor(), location -> {
                    if (location != null) emitLocation(location);
                });
            } catch (Exception ignored) {}
        } else {
            locationManager.requestLocationUpdates(provider, 1000L, 0f, locationListener, Looper.getMainLooper());
            getLastKnown(provider);
        }
    }

    private void getLastKnown(String provider) {
        if (!isProviderEnabled(provider)) return;
        try {
            Location last = locationManager.getLastKnownLocation(provider);
            if (last != null) emitLocation(last);
        } catch (SecurityException ignored) {}
    }

    private void stopTracking() {
        if (locationManager != null && locationListener != null) {
            try { locationManager.removeUpdates(locationListener); } catch (Exception ignored) {}
        }
        tracking = false;
        emitStatus("tracking_stopped");
    }

    private void emitLocation(Location location) {
        lastFixAt = System.currentTimeMillis();
        lastProvider = location.getProvider() == null ? "unknown" : location.getProvider();
        JSObject data = new JSObject();
        data.put("latitude", location.getLatitude());
        data.put("longitude", location.getLongitude());
        data.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : org.json.JSONObject.NULL);
        data.put("altitude", location.hasAltitude() ? location.getAltitude() : org.json.JSONObject.NULL);
        data.put("speed", location.hasSpeed() ? location.getSpeed() : org.json.JSONObject.NULL);
        data.put("bearing", location.hasBearing() ? location.getBearing() : org.json.JSONObject.NULL);
        data.put("timestamp", location.getTime());
        data.put("provider", lastProvider);
        notifyListeners("location", data);
        emitStatus("fix:" + lastProvider);
    }

    private void emitStatus(String status) {
        JSObject data = new JSObject();
        data.put("status", status);
        notifyListeners("status", data);
    }

    private String safeMessage(Exception e) {
        String msg = e.getMessage();
        return msg == null || msg.isEmpty() ? e.getClass().getSimpleName() : msg;
    }

    @Override
    protected void handleOnDestroy() {
        stopTracking();
        super.handleOnDestroy();
    }
}
