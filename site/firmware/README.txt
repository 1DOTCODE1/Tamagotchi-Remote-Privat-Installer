Place the web-flashable factory image and OTA application image here:

    tamagotchi-remote.factory.bin
    tamagotchi-remote.ota.bin

The manifest assumes:
    chipFamily: ESP32-S3
    factory flash offset: 0

The factory/merged image is used by ESP Web Tools for first installation.
The OTA image is used by ESPHome update.http_request for installed devices.

The Pages build recalculates ota.md5 from tamagotchi-remote.ota.bin automatically.
Keep the manifest version and both firmware binaries from the same firmware release.
