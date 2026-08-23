# Tamagotchi provisioning protocol v1

The web installer sends either a browser-generated API encryption key or a user-supplied API encryption key using this serial protocol. The factory firmware must implement it for the **Provision device** button to work.

## Transport

- Web Serial
- 115200 baud
- UTF-8
- Newline-delimited JSON
- One provisioning request per connection
- The device should send its JSON response **before rebooting**

If normal ESPHome logging uses the same serial interface, either disable/redirect serial logs or make the firmware parser and response framing robust enough that JSON lines remain unambiguous.

## Request

The browser sends:

```json
{
  "protocol": "tamagotchi-provision-v1",
  "command": "provision",
  "wifi": {
    "ssid": "My Wi-Fi",
    "password": "secret",
    "mode": "static",
    "static_ip": "192.168.1.50",
    "gateway": "192.168.1.1",
    "subnet": "255.255.255.0",
    "dns1": "192.168.1.1",
    "dns2": "1.1.1.1"
  },
  "api_encryption_key": "BASE64_32_BYTE_KEY"
}
```

For DHCP, `wifi` is:

```json
{
  "ssid": "My Wi-Fi",
  "password": "secret",
  "mode": "dhcp"
}
```

## Successful response

```json
{
  "protocol": "tamagotchi-provision-v1",
  "status": "ok",
  "hostname": "tamagotchi-remote-a1b2c3",
  "ip": "192.168.1.50"
}
```

## Error response

```json
{
  "protocol": "tamagotchi-provision-v1",
  "status": "error",
  "message": "Static IP is outside the gateway subnet"
}
```

## Factory firmware responsibilities

The firmware-side provisioning component must:

1. Validate the JSON and network values.
2. Store Wi-Fi SSID/password in ESPHome-compatible persistent storage.
3. Store DHCP/static selection plus static IP/gateway/subnet/DNS settings.
4. Store the API encryption key persistently and activate it.
5. Reply with `status: ok`, hostname and the effective IP.
6. Reboot only after the response has been sent.

Firmware updates are distributed through the HTTP update manifest published by GitHub Pages.

## ESPHome compile-time prerequisites

The exact external/custom component is project-specific, but the factory configuration should compile in the required facilities. Conceptually:

```yaml
api:
  id: api_server
  encryption:

http_request:

ota:
  - platform: http_request
    id: http_ota

update:
  - platform: http_request
    id: firmware_update
    ota_id: http_ota
    source: "https://<user>.github.io/<repo>/manifest.json"

provisioning:
  timeout: 10min

# Your custom external component handles:
# - serial JSON
# - NVS/preferences persistence
# - runtime Wi-Fi/static IP application
# - API key application
```

Do not put per-device API secrets in the public GitHub repository. The installer can generate the API key in the browser or accept a value entered manually by the user.
