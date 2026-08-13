# Tamagotchi Remote Installer

This page installs and configures a **Tamagotchi Remote** directly from your browser over USB.

You do not need to install ESPHome or any command-line tools to perform the initial setup.

## What you need

Before starting, have the following ready:

- A Tamagotchi Remote connected with a **USB data cable**.
- A desktop/laptop running a Chromium-based browser with Web Serial support, such as Chrome or Edge.
- The Wi-Fi network name (SSID) and password that the device should use.
- If you want a static IP, the static address, gateway, subnet mask, and DNS addresses for your network.

The installer must be opened from its normal **HTTPS GitHub Pages address**. Web Serial will not work from an insecure HTTP page.

## 1. Enter your Wi-Fi settings

Enter the Wi-Fi SSID and password for the network the Tamagotchi Remote should join.

Choose one of these network modes:

- **DHCP** — recommended for most users. Your router chooses the device IP address automatically.
- **Static IP** — use this if you want the device to always use a specific address. Make sure the IP, gateway, subnet, and DNS values are correct for your network.

## 2. Choose the API and OTA credentials

The installer lets you configure the two credentials independently.

### ESPHome API encryption key

This is used for the encrypted ESPHome native API connection, including Home Assistant.

Choose:

- **Random** — the installer generates a new secure 32-byte Base64 key locally in your browser.
- **Manual** — enter an existing ESPHome API encryption key. It must be Base64 and decode to exactly 32 bytes.

### ESPHome OTA password

This is used for future ESPHome OTA firmware uploads.

Choose:

- **Random** — the installer generates a new random 64-character password locally in your browser.
- **Manual** — enter your own password using 1–64 printable ASCII characters.

You can mix these options. For example, you can generate a random API key while using your existing OTA password.

If either credential is set to **Random**, you can click **Regenerate random values** before provisioning to create a new value.

## 3. Install the firmware

Click **Connect & install firmware**.

When your browser asks you to choose a serial device, select the Tamagotchi Remote / ESP32-S3 USB device.

Follow the installation dialog until flashing completes, then close the dialog.

If the device does not appear in the list, check that your USB cable supports data and reconnect the device.

## 4. Provision the device

After flashing, click **Provision device**.

The browser will ask you to select the serial port again. Choose the Tamagotchi Remote.

The installer sends the Wi-Fi configuration, API encryption key, and OTA password directly to the device. Wait for the device to confirm that provisioning completed successfully.

## 5. Save your credentials

After successful provisioning, the page shows:

- Device hostname
- Device IP address, when available
- ESPHome API encryption key
- ESPHome OTA password

Keep the API key and OTA password somewhere secure.

You can use **Download credentials** to save an ESPHome YAML snippet, or copy the values individually.

The API encryption key is needed when connecting the device to Home Assistant if it is not already known there. The OTA password is used when uploading future ESPHome firmware updates over the network.

## Privacy and security

The installer has no backend for storing your Wi-Fi password, API key, or OTA password.

Random credentials are generated locally in your browser. Your configuration is sent directly from the browser to the connected Tamagotchi Remote over USB.

Do not share the downloaded credentials file publicly. It contains secrets that provide access to your device.

## Troubleshooting

### The install button says the browser is unsupported

Use a Chromium-based desktop browser such as Chrome or Edge. Web Serial is not available in every browser or on every mobile platform.

### The device does not appear when choosing a USB device

- Make sure the USB cable supports data, not only charging.
- Disconnect and reconnect the device.
- Try another USB port.
- If required by your hardware, put the ESP32-S3 into its USB boot/download mode and try again.

### Provisioning times out

After the firmware installation finishes, close the flashing dialog and click **Provision device**. Select the Tamagotchi Remote serial port again.

If it still times out, reconnect the device and retry provisioning.

### The device does not connect to Wi-Fi

Check the SSID and password. If you selected a static IP, verify that the IP address, gateway, subnet mask, and DNS values belong to the correct network.

You can run the installer again to reconfigure the device when USB provisioning is enabled.

### My manual API key is rejected

An ESPHome API encryption key must be a Base64 value representing exactly 32 bytes. If you do not already have a compatible key, select **Random** and let the installer create one.
