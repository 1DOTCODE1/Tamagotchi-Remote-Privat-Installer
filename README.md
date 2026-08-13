# Tamagotchi Remote Installer

A backend-free GitHub Pages installer for a custom ESPHome device.

It provides:

- ESP Web Tools factory flashing
- Wi-Fi SSID/password entry
- DHCP or static IPv4 configuration
- browser-generated 32-byte Base64 ESPHome API encryption key
- browser-generated 256-bit OTA password
- JSON-over-Web-Serial provisioning
- final credential screen
- downloadable ESPHome credential YAML
- runtime self-hosting of ESP Web Tools (no CDN on the deployed site)

## Important: two pieces are required

The **website** is implemented here.

The **factory firmware** still needs a small custom ESPHome/external component implementing the serial protocol described in `FIRMWARE_PROTOCOL.md`. Stock ESP Web Tools/Improv does not carry all of the custom static-IP + OTA + API fields used by this installer.

## 1. Add your firmware

Compile your factory firmware and copy the web-flashable merged/factory image to:

```text
site/firmware/tamagotchi-remote.factory.bin
```

Then edit:

```text
site/manifest.json
```

The template currently uses:

```json
"chipFamily": "ESP32-S3"
```

Change that if your board uses another supported family.

Also update the firmware version in the manifest for each release.

## 2. Create the GitHub repository

Create a repository, for example:

```text
tamagotchi-installer
```

Then put this whole project in the repository and push it to the `main` branch.

With Git installed locally:

```bash
git init
git add .
git commit -m "Initial Tamagotchi installer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tamagotchi-installer.git
git push -u origin main
```

You can also upload the files using GitHub's web interface.

## 3. Enable GitHub Pages

On GitHub:

1. Open the repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push to `main` if a deployment is not already running.
5. Open the **Actions** tab and wait for the `Deploy installer to GitHub Pages` workflow to succeed.

Your site will normally be available at:

```text
https://YOUR-USERNAME.github.io/tamagotchi-installer/
```

GitHub Pages supplies HTTPS, which Web Serial/ESP Web Tools requires.

## 4. How deployment works

The GitHub Action:

1. installs the pinned `esp-web-tools` package;
2. copies your `site/` folder into `dist/`;
3. copies ESP Web Tools into `dist/vendor/esp-web-tools/`;
4. publishes `dist/` to GitHub Pages.

The browser therefore loads ESP Web Tools from **your own GitHub Pages site**, not from a CDN.

## 5. Installer flow

The user:

1. enters Wi-Fi information;
2. chooses DHCP or static IP;
3. connects the device and flashes the firmware;
4. closes the ESP Web Tools dialog;
5. clicks **Provision device** and selects the serial port again;
6. the site sends one JSON provisioning message at 115200 baud;
7. the firmware saves everything and replies with hostname/IP;
8. the site displays the API key and OTA password.

Secrets are held in browser memory until provisioning completes. The site does not intentionally store them in localStorage or upload them.

## 6. Firmware-side requirements

Read:

```text
FIRMWARE_PROTOCOL.md
```

The custom firmware component must persist:

- SSID/password
- DHCP/static mode
- static IP/gateway/subnet/DNS when applicable
- API encryption key
- OTA password

It must also restore/apply those values at boot.

## 7. Updating firmware releases

Replace:

```text
site/firmware/tamagotchi-remote.factory.bin
```

and bump:

```json
"version": "1.0.1"
```

in `site/manifest.json`, then commit/push. GitHub Pages redeploys automatically.

## Security notes

- Never commit generated customer/device API keys or OTA passwords.
- Keep the factory firmware free of shared permanent secrets where possible.
- Treat downloaded credential YAML files as sensitive.
- The GitHub repository and Pages site may be public, but per-device secrets are generated client-side.
