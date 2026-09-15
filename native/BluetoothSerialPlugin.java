package com.lukman.motomonitor;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "BluetoothSerial")
public class BluetoothSerialPlugin extends Plugin {
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private BluetoothSocket socket;
    private InputStream input;
    private OutputStream output;
    private volatile boolean reading;

    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        return getContext().checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
                && getContext().checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void list(PluginCall call) {
        if (!hasPermission()) { call.reject("Bluetooth permissions are not granted"); return; }
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) { call.reject("Bluetooth not supported"); return; }
        try {
            JSArray devices = new JSArray();
            for (BluetoothDevice d : adapter.getBondedDevices()) {
                JSObject o = new JSObject();
                o.put("id", d.getAddress());
                o.put("address", d.getAddress());
                o.put("name", d.getName() == null ? "Unknown" : d.getName());
                devices.put(o);
            }
            JSObject result = new JSObject();
            result.put("devices", devices);
            call.resolve(result);
        } catch (SecurityException e) { call.reject("Bluetooth permission denied", e); }
    }

    @PluginMethod
    public void connectInsecure(PluginCall call) {
        if (!hasPermission()) { call.reject("Bluetooth permissions are not granted"); return; }
        String address = call.getString("id", call.getString("address", null));
        if (address == null || address.isEmpty()) { call.reject("Bluetooth device address is required"); return; }
        executor.execute(() -> {
            try {
                closeSocket();
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                BluetoothDevice device = adapter.getRemoteDevice(address);
                if (adapter.isDiscovering()) adapter.cancelDiscovery();
                BluetoothSocket s;
                try {
                    s = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID);
                    s.connect();
                } catch (Exception first) {
                    s = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    s.connect();
                }
                socket = s;
                input = s.getInputStream();
                output = s.getOutputStream();
                reading = true;
                notifyStatus(true, device.getName() == null ? address : device.getName());
                startReader();
                call.resolve();
            } catch (Exception e) {
                closeSocket();
                notifyStatus(false, address);
                call.reject("SPP connect failed: " + e.getMessage(), e);
            }
        });
    }

    private void startReader() {
        executor.execute(() -> {
            byte[] buffer = new byte[1024];
            try {
                while (reading && socket != null && socket.isConnected()) {
                    int n = input.read(buffer);
                    if (n < 0) break;
                    if (n == 0) continue;
                    JSArray data = new JSArray();
                    for (int i = 0; i < n; i++) data.put(buffer[i] & 0xff);
                    JSObject event = new JSObject();
                    event.put("data", data);
                    notifyListeners("rawData", event);
                }
            } catch (Exception ignored) {
            } finally {
                if (reading) notifyStatus(false, null);
                reading = false;
            }
        });
    }

    @PluginMethod public void subscribeRawData(PluginCall call) { call.resolve(); }
    @PluginMethod public void unsubscribeRawData(PluginCall call) { call.resolve(); }

    @PluginMethod
    public void write(PluginCall call) {
        JSArray data = call.getArray("data");
        if (data == null) { call.reject("data is required"); return; }
        executor.execute(() -> {
            try {
                if (output == null || socket == null || !socket.isConnected()) throw new IllegalStateException("SPP not connected");
                byte[] bytes = new byte[data.length()];
                for (int i = 0; i < data.length(); i++) bytes[i] = (byte) data.getInt(i);
                output.write(bytes);
                output.flush();
                call.resolve();
            } catch (Exception e) { call.reject("SPP write failed: " + e.getMessage(), e); }
        });
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        executor.execute(() -> { closeSocket(); notifyStatus(false, null); call.resolve(); });
    }

    @PluginMethod
    public void showBluetoothSettings(PluginCall call) {
        try {
            getActivity().startActivity(new android.content.Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS));
            call.resolve();
        } catch (Exception e) { call.reject("Unable to open Bluetooth settings", e); }
    }

    private synchronized void closeSocket() {
        reading = false;
        try { if (input != null) input.close(); } catch (Exception ignored) {}
        try { if (output != null) output.close(); } catch (Exception ignored) {}
        try { if (socket != null) socket.close(); } catch (Exception ignored) {}
        input = null; output = null; socket = null;
    }

    private void notifyStatus(boolean connected, String name) {
        JSObject event = new JSObject();
        event.put("connected", connected);
        if (name != null) event.put("name", name);
        notifyListeners("status", event);
    }

    @Override protected void handleOnDestroy() {
        closeSocket();
        executor.shutdownNow();
        super.handleOnDestroy();
    }
}
