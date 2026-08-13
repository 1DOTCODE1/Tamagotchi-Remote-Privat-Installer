# Tamagotchi provisioning protocol v1

The web installer sends either browser-generated or user-supplied credentials using this serial protocol. The factory firmware must implement it for the **Provision device** button to work.

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
  "api_encryption_key": "BASE64_32_BYTE_KEY",
  "ota_password": "64_HEX_CHAR_PASSWORD"
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
5. Store the OTA password persistently and call the OTA component's runtime password setter on every boot.
6. Reply with `status: ok`, hostname and the effective IP.
7. Reboot only after the response has been sent.

## ESPHome compile-time prerequisites

The exact external/custom component is project-specific, but the factory configuration should compile in the required facilities. Conceptually:

```yaml
api:
  id: api_server
  encryption:

ota:
  - platform: esphome
    id: ota_esphome
    password: ""

provisioning:
  timeout: 10min

# Your custom external component handles:
# - serial JSON
# - NVS/preferences persistence
# - runtime Wi-Fi/static IP application
# - API key application
# - id(ota_esphome).set_auth_password(...)
```

Do not put per-device API or OTA secrets in the public GitHub repository. The installer can generate them in the browser or accept values entered manually by the user.
