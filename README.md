# MotoMonitor

Motorcycle telemetry monitor for Android.

## Current foundation

- Vite web application
- Capacitor Android packaging
- Bluetooth LE integration scaffold
- BMS and controller telemetry dashboard
- Event log UI
- GitHub Actions debug APK build

## Architecture

```text
Android APK
   |
Capacitor
   |
Bluetooth LE
   +---- BMS protocol adapter
   |
   +---- Controller protocol adapter
   |
Telemetry state -> Dashboard -> Event log
```

The BMS and controller protocol adapters are intentionally kept separate from the UI. Hardware-specific protocol details will be added after the new project's BMS/controller hardware is confirmed.

## APK

Every push to `main` triggers the Android build workflow. The generated debug APK is published as a GitHub Actions artifact named `MotoMonitor-debug-apk`.

## Reference

The supplied reference JavaScript was used only to establish the initial application architecture and Bluetooth/telemetry direction. MotoMonitor is a separate project.
