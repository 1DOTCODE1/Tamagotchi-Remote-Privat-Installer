# Tamagotchi Remote Installer

A static web page that installs and provisions a **Tamagotchi Remote** (ESP32-S3, ESPHome firmware) directly from your browser over USB.

You do not need to install ESPHome or any command-line tools to set up a device. Flashing is done with [ESP Web Tools](https://esphome.github.io/esp-web-tools/), and provisioning (Wi-Fi + API key) is sent over Web Serial.

Current firmware release: **V1.0Alpha/2026.10** (see `site/manifest.json`).

## What you need

- A Tamagotchi Remote connected with a **USB data cable**.
- A desktop/laptop running a Chromium-based browser with Web Serial support, such as Chrome or Edge.
- The Wi-Fi network name (SSID) and password the device should use.
- For a static IP: the IP address, gateway, subnet mask and DNS server(s) for your network.

The installer must be opened from its **HTTPS GitHub Pages address**. Web Serial does not work from an insecure HTTP page.

## Using the installer

### 1. Device configuration

Enter the Wi-Fi SSID and password, then choose an IP configuration:

- **DHCP** — recommended. Your router assigns the address.
- **Static IP** — enter Static IP, Gateway, Subnet mask (defaults to `255.255.255.0`), DNS 1 and optionally DNS 2. All values must be valid IPv4 addresses.

Then choose how the ESPHome API encryption key is created:

- **Random** — recommended. A 32-byte Base64 key is generated locally in your browser. Use **Regenerate** for a new one.
- **Manual** — enter an existing ESPHome API encryption key. It must be Base64 and decode to exactly 32 bytes.

Validation errors are shown under the form. You can expand **Show provisioning data preview** in step 3 to see what will be sent (the Wi-Fi password and API key are masked).

### 2. Install factory firmware

Click **Connect & install firmware** and select the Tamagotchi Remote / ESP32-S3 USB device when the browser asks. The installer erases the device and writes the factory image.

When the dialog reports that flashing is complete, close it.

### 3. Provision over USB

Click **Provision device** and select the Tamagotchi Remote serial port again.

The browser sends the Wi-Fi settings and API encryption key to the device and waits up to 20 seconds for confirmation.

### 4. Save your credential

After successful provisioning, the page shows the device **hostname**, **IP address** (when reported) and **API encryption key**.

- **Copy** copies the API key.
- **Download credentials** saves `<hostname>-credentials.yaml` with an ESPHome `api: encryption: key:` snippet.
- **Copy ESPHome YAML** copies the same snippet.

Keep the API key somewhere secure — Home Assistant needs it to connect to the device.

## Firmware updates

Installed devices update themselves through ESPHome `update.http_request`, using the same `manifest.json` published on GitHub Pages:

- `builds[].parts` points to `firmware/tamagotchi-remote.factory.bin` (offset `0`) for first installation with ESP Web Tools.
- `builds[].ota.path` points to `firmware/tamagotchi-remote.ota.bin` for OTA updates.
- `builds[].ota.md5` must match the OTA binary. `npm run build` recalculates it into `dist/manifest.json`, but keep the value in `site/manifest.json` in sync too.

To publish a new release:

1. Replace both binaries in `site/firmware/` with matching build artifacts from the same firmware release.
2. Bump `version` in `site/manifest.json`.
3. Update `ota.md5` (`md5 site/firmware/tamagotchi-remote.ota.bin` on macOS, `md5sum` on Linux).
4. Push to `main` — the GitHub Actions workflow deploys the site.

## Development

Project layout:

| Path | Purpose |
| --- | --- |
| `site/index.html`, `site/app.js`, `site/styles.css` | Installer page and provisioning logic |
| `site/manifest.json` | ESP Web Tools / ESPHome update manifest |
| `site/firmware/` | Factory and OTA firmware images |
| `scripts/build.mjs` | Copies `site/` to `dist/`, vendors ESP Web Tools, writes the OTA MD5 |
| `.github/workflows/pages.yml` | Builds and deploys `dist/` to GitHub Pages on push to `main` |
| `FIRMWARE_PROTOCOL.md` | Serial provisioning protocol the firmware must implement |

Build locally (Node 24 is used in CI):

```bash
npm install
```

```bash
npm run build
```

The output in `dist/` is a self-contained static site. ESP Web Tools (`esp-web-tools` 10.1.1) is bundled into `dist/vendor/esp-web-tools/`, so no CDN is used. Serve `dist/` from `localhost` or HTTPS to test Web Serial.

## Provisioning protocol

The **Provision device** step uses newline-delimited JSON over Web Serial at 115200 baud (`tamagotchi-provision-v1`). See [FIRMWARE_PROTOCOL.md](FIRMWARE_PROTOCOL.md) for the request/response format and firmware responsibilities.

## Privacy and security

The installer has no backend. Random API keys are generated locally in your browser, and your configuration is sent directly from the browser to the connected device over USB.

Do not share the downloaded credentials file publicly — it contains a secret that grants access to your device. Never commit per-device API keys to this repository.

## Troubleshooting

### The install button says the browser is unsupported

Use a Chromium-based desktop browser such as Chrome or Edge. Web Serial is not available in every browser or on mobile.

### "The installer must be opened from a secure HTTPS page"

Open the GitHub Pages `https://` address (or `localhost` during development).

### The device does not appear when choosing a USB device

- Make sure the USB cable supports data, not only charging.
- Disconnect and reconnect the device, or try another USB port.
- If needed, put the ESP32-S3 into USB boot/download mode and try again.

### Provisioning times out

Close the flashing dialog first so it releases the serial port, then click **Provision device** and select the port again. If it still times out, reconnect the device and retry.

### The device does not connect to Wi-Fi

Check the SSID and password. For a static IP, verify the IP, gateway, subnet mask and DNS values belong to your network. You can rerun provisioning to reconfigure the device.

### My manual API key is rejected

The key must be Base64 that decodes to exactly 32 bytes. If you don't have a compatible key, select **Random**.

### The page looks outdated after an update

Asset filenames are not versioned, so your browser may serve cached `app.js` / `styles.css`. Do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R).
