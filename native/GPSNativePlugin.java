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
            requestPermissionForAlias("location", call, "permissionCallback");
            return;
        }
        try { startTracking(); call.resolve(); }
        catch (Exception e) { call.reject("GPS start failed: " + e.getMessage()); }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (!hasLocationPermission()) { call.reject("Location permission denied"); return; }
        try { startTracking(); call.resolve(); }
        catch (Exception e) { call.reject("GPS start failed: " + e.getMessage()); }
    }

    @PluginMethod
    public void stop(PluginCall call) { stopTracking(); call.resolve(); }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject out = new JSObject();
        out.put("permission", hasLocationPermission() ? "granted" : "denied");
        out.put("locationEnabled", isLocationEnabled());
        out.put("gpsEnabled", isProviderEnabled(LocationManager.GPS_PROVIDER));
        out.put("networkEnabled", isProviderEnabled(LocationManager.NETWORK_PROVIDER));
        out.put("fusedEnabled", Build.VERSION.SDK_INT >= 31 && isProviderEnabled(LocationManager.FUSED_PROVIDER));
        out.put("tracking", tracking);
        call.resolve(out);
    }

    private boolean hasLocationPermission() {
        return androidx.core.content.ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || androidx.core.content.ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isProviderEnabled(String provider) {
        try { return locationManager != null && locationManager.isProviderEnabled(provider); }
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

        getLastKnown(LocationManager.GPS_PROVIDER);
        getLastKnown(LocationManager.NETWORK_PROVIDER);
        if (Build.VERSION.SDK_INT >= 31) getLastKnown(LocationManager.FUSED_PROVIDER);

        boolean registered = false;
        if (isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 0f, locationListener, Looper.getMainLooper());
            registered = true;
        }
        if (isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1000L, 0f, locationListener, Looper.getMainLooper());
            registered = true;
        }
        if (Build.VERSION.SDK_INT >= 31 && isProviderEnabled(LocationManager.FUSED_PROVIDER)) {
            locationManager.requestLocationUpdates(LocationManager.FUSED_PROVIDER, 1000L, 0f, locationListener, Looper.getMainLooper());
            registered = true;
        }
        if (!registered) throw new IllegalStateException("No Android location provider is enabled");
        tracking = true;
        emitStatus("tracking_started");
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
    }

    private void emitLocation(Location location) {
        JSObject data = new JSObject();
        data.put("latitude", location.getLatitude());
        data.put("longitude", location.getLongitude());
        data.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : JSONObjectNull());
        data.put("altitude", location.hasAltitude() ? location.getAltitude() : JSONObjectNull());
        data.put("speed", location.hasSpeed() ? location.getSpeed() : JSONObjectNull());
        data.put("bearing", location.hasBearing() ? location.getBearing() : JSONObjectNull());
        data.put("timestamp", location.getTime());
        data.put("provider", location.getProvider());
        notifyListeners("location", data);
    }

    private Object JSONObjectNull() { return org.json.JSONObject.NULL; }

    private void emitStatus(String status) {
        JSObject data = new JSObject();
        data.put("status", status);
        notifyListeners("status", data);
    }

    @Override
    protected void handleOnDestroy() { stopTracking(); super.handleOnDestroy(); }
}
