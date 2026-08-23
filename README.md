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

## 2. Choose the API credential

Choose how the ESPHome API encryption key should be created:

- **Random** — recommended. The installer generates a new 32-byte Base64 ESPHome API encryption key locally in your browser.
- **Manual** — enter an existing ESPHome API encryption key. The key must be Base64 and decode to exactly 32 bytes.


## 3. Install the firmware

Click **Connect & install firmware**.

When your browser asks you to choose a serial device, select the Tamagotchi Remote / ESP32-S3 USB device.

Follow the installation dialog until flashing completes, then close the dialog.

If the device does not appear in the list, check that your USB cable supports data and reconnect the device.

## 4. Provision the device

After flashing, click **Provision device**.

The browser will ask you to select the serial port again. Choose the Tamagotchi Remote.

The installer sends the Wi-Fi configuration and API encryption key directly to the device. Wait for the device to confirm that provisioning completed successfully.

## 5. Save your credential

After successful provisioning, the page shows:

- Device hostname
- Device IP address, when available
- ESPHome API encryption key

Keep the API key somewhere secure.

You can use **Download credentials** to save an ESPHome YAML snippet, or copy the value directly.

The API encryption key is needed when connecting the device to Home Assistant if it is not already known there.

## Firmware updates

The GitHub Pages manifest supports both first installation and ESPHome managed HTTP updates:

- `parts` points to `firmware/tamagotchi-remote.factory.bin` for ESP Web Tools.
- `ota.path` points to `firmware/tamagotchi-remote.ota.bin` for ESPHome `update.http_request`.
- `ota.md5` is calculated automatically by `npm run build` from the OTA binary before the Pages site is published.

For a new release, update the manifest version and replace both firmware binaries with the matching build artifacts before publishing.

## Privacy and security

The installer has no backend for storing your Wi-Fi password or API key.

Random API credentials are generated locally in your browser. Your configuration is sent directly from the browser to the connected Tamagotchi Remote over USB.

Do not share the downloaded credentials file publicly. It contains a secret that provides access to your device.

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

### The page does not react when I change an option

Refresh the installer page once. The installer uses versioned page assets so updated controls and behavior load together.
