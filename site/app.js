const PROTOCOL = "tamagotchi-provision-v1";
const BAUD_RATE = 115200;
const RESPONSE_TIMEOUT_MS = 20000;

const $ = (id) => document.getElementById(id);

let secrets = {};
let lastResult = { hostname: "", ip: "" };

function randomBytes(length) {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

function toBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateSecrets() {
  secrets = {
    apiEncryptionKey: toBase64(randomBytes(32)),
    otaPassword: toHex(randomBytes(32)),
  };
  updatePreview();
}

function ipMode() {
  return document.querySelector('input[name="ip-mode"]:checked').value;
}

function value(id) {
  return $(id).value.trim();
}

function validIPv4(ip) {
  const parts = ip.split(".");
  return parts.length === 4 && parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255 && String(n) === String(Number(p));
  });
}

function buildPayload() {
  const mode = ipMode();
  const wifi = {
    ssid: value("ssid"),
    password: $("wifi-password").value,
    mode,
  };

  if (mode === "static") {
    wifi.static_ip = value("static-ip");
    wifi.gateway = value("gateway");
    wifi.subnet = value("subnet");
    wifi.dns1 = value("dns1");
    if (value("dns2")) wifi.dns2 = value("dns2");
  }

  return {
    protocol: PROTOCOL,
    command: "provision",
    wifi,
    api_encryption_key: secrets.apiEncryptionKey,
    ota_password: secrets.otaPassword,
  };
}

function safePreview(payload) {
  const clone = structuredClone(payload);
  if (clone.wifi.password) clone.wifi.password = "••••••••";
  clone.api_encryption_key = "(generated locally; hidden until completion)";
  clone.ota_password = "(generated locally; hidden until completion)";
  return clone;
}

function updatePreview() {
  $("payload-preview").textContent = JSON.stringify(safePreview(buildPayload()), null, 2);
}

function validate() {
  const errors = [];
  if (!value("ssid")) errors.push("Wi-Fi SSID is required.");

  if (ipMode() === "static") {
    const fields = [
      ["Static IP", value("static-ip")],
      ["Gateway", value("gateway")],
      ["Subnet", value("subnet")],
      ["DNS 1", value("dns1")],
    ];
    for (const [label, ip] of fields) {
      if (!validIPv4(ip)) errors.push(`${label} must be a valid IPv4 address.`);
    }
    if (value("dns2") && !validIPv4(value("dns2"))) {
      errors.push("DNS 2 must be a valid IPv4 address.");
    }
  }

  $("validation").textContent = errors.join(" ");
  $("validation").classList.toggle("error", errors.length > 0);
  return errors.length === 0;
}

function setModeVisibility() {
  $("static-fields").classList.toggle("hidden", ipMode() !== "static");
  validate();
  updatePreview();
}

function setSerialStatus(message, type = "") {
  const el = $("serial-status");
  el.textContent = message;
  el.className = `serial-status ${type}`.trim();
}

async function readProvisionResponse(port) {
  const decoder = new TextDecoder();
  const reader = port.readable.getReader();
  let buffer = "";

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timed out waiting for the device response.")), RESPONSE_TIMEOUT_MS)
  );

  const readLoop = (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) throw new Error("Serial connection closed before a provisioning response arrived.");
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("{")) continue;

          try {
            const msg = JSON.parse(line);
            if (msg.protocol !== PROTOCOL) continue;
            if (msg.status === "ok") return msg;
            if (msg.status === "error") throw new Error(msg.message || "Device rejected provisioning.");
          } catch (err) {
            if (err instanceof SyntaxError) continue;
            throw err;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return Promise.race([readLoop, timeout]);
}

async function provision() {
  if (!validate()) {
    $("config-card").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (!("serial" in navigator)) {
    setSerialStatus("Web Serial is not available in this browser.", "error");
    return;
  }

  const button = $("provision");
  button.disabled = true;
  setSerialStatus("Choose the Tamagotchi Remote serial port…");

  let port;
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: BAUD_RATE });

    setSerialStatus("Connected. Sending provisioning data…");

    const writer = port.writable.getWriter();
    const payload = JSON.stringify(buildPayload()) + "\n";
    await writer.write(new TextEncoder().encode(payload));
    writer.releaseLock();

    setSerialStatus("Configuration sent. Waiting for confirmation…");
    const response = await readProvisionResponse(port);

    lastResult = {
      hostname: response.hostname || "tamagotchi-remote",
      ip: response.ip || (ipMode() === "static" ? value("static-ip") : "DHCP"),
    };

    showResult();
    setSerialStatus("Provisioning completed successfully.", "ok");
  } catch (err) {
    console.error(err);
    setSerialStatus(err?.message || String(err), "error");
  } finally {
    button.disabled = false;
    if (port) {
      try { await port.close(); } catch (_) {}
    }
  }
}

function yamlText() {
  return `# Tamagotchi Remote credentials
# Store this file securely.

# Device observed after provisioning:
# hostname: ${lastResult.hostname || "unknown"}
# ip: ${lastResult.ip || "unknown"}

api:
  encryption:
    key: "${secrets.apiEncryptionKey}"

ota:
  - platform: esphome
    password: "${secrets.otaPassword}"
`;
}

function showResult() {
  $("result-hostname").textContent = lastResult.hostname || "—";
  $("result-ip").textContent = lastResult.ip || "—";
  $("result-api").textContent = secrets.apiEncryptionKey;
  $("result-ota").textContent = secrets.otaPassword;
  $("result-card").classList.remove("hidden");
  $("result-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  if (button) {
    const old = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = old; }, 1200);
  }
}

function downloadCredentials() {
  const blob = new Blob([yamlText()], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lastResult.hostname || "tamagotchi-remote"}-credentials.yaml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.querySelectorAll('input[name="ip-mode"]').forEach((el) =>
  el.addEventListener("change", setModeVisibility)
);
document.querySelectorAll("input").forEach((el) =>
  el.addEventListener("input", () => { validate(); updatePreview(); })
);

$("regenerate").addEventListener("click", () => {
  generateSecrets();
  $("regenerate").textContent = "Regenerated";
  setTimeout(() => { $("regenerate").textContent = "Regenerate"; }, 1200);
});

$("provision").addEventListener("click", provision);
$("download-credentials").addEventListener("click", downloadCredentials);
$("copy-yaml").addEventListener("click", (event) => copyText(yamlText(), event.currentTarget));

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyText($(button.dataset.copy).textContent, button));
});

generateSecrets();
setModeVisibility();
