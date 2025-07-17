const express = require("express");
const cors = require("cors");
const hmacsha1 = require("hmacsha1");
const uuid = require("uuid");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

const appid = "challenge_uprodit";
const env = "production";

app.use(cors());
app.use(express.static("public")); // Sert index.html depuis ./public

// Génère la signature sécurisée pour l’API
function generateSignature(appid, env, uri) {
  auth_signature_method = 'HMAC-SHA1';
  auth_consumer_key = encodeURIComponent(hmacsha1(appid, env));
  auth_token = uuid.v4();
  uri_path = uri.replace(new RegExp('http(s)?://[^/]*'), '')
  auth_signature = encodeURIComponent(hmacsha1(appid, uri_path + auth_token));
  auth_nonce = encodeURIComponent(hmacsha1(appid, uuid.v4()));
  auth_callback = encodeURIComponent(uri_path);
  auth_timestamp = new Date().getTime();

  return `Auth ?auth_signature=${auth_signature}&auth_nonce=${auth_nonce}&auth_callback=${auth_callback}&auth_timestamp=${auth_timestamp}&auth_token=${auth_token}&auth_signature_method=${auth_signature_method}&auth_consumer_key=${auth_consumer_key}`;
}

// Route intermédiaire entre index.html et API Uprodit
app.get("/api/profiles", async (req, res) => {
  const baseUrl = "https://api.uprodit.com/v1/profile/all";
  const params = "?startIndex=0&maxResults=50";
  const fullUrl = baseUrl + params;
  const signature = generateSignature(appid, env, fullUrl);

  console.log("🔗 Final URL: " + fullUrl);

  try {
    const response = await fetch(fullUrl, {
      headers: {
        "Authorization": signature,
      },
    });

    if (!response.ok) {
      console.error("❌ Uprodit API error: "  + response.status);
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Internal error:", error.message);
    res.status(500).json({ error: "API request failed", detail: error.message });
  }
});



// Démarre le serveur proxy
app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
app.get("/favicon.ico", (req, res) => res.status(204).end());
