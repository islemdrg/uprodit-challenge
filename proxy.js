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
  const auth_signature_method = "HMAC-SHA1";
  const auth_consumer_key = encodeURIComponent(hmacsha1(appid, env));
  const auth_token = uuid.v4();
  const uri_path = uri.replace(/^https?:\/\/[^/]+/, "");
  const auth_signature = encodeURIComponent(
    hmacsha1(appid, uri_path + auth_token)
  );
  const auth_nonce = encodeURIComponent(hmacsha1(appid, uuid.v4()));
  const auth_callback = encodeURIComponent(uri_path);
  const auth_timestamp = new Date().getTime();

  return `?auth_signature=${auth_signature}&auth_nonce=${auth_nonce}&auth_callback=${auth_callback}&auth_timestamp=${auth_timestamp}&auth_token=${auth_token}&auth_signature_method=${auth_signature_method}&auth_consumer_key=${auth_consumer_key}`;
}

// intermédiaire entre index.html et API Uprodit
app.get("/api/profiles", async (req, res) => {
  const baseUrl = "https://api.uprodit.com/v1/profile/all";
  const params = "?startIndex=0&maxResults=50";
  const fullUrl = baseUrl + params;
  const signature = generateSignature(appid, env, fullUrl);
  const finalUrl = fullUrl + "&" + signature.substring(1);

  console.log("🔗 Final URL:", finalUrl);

  try {
    const response = await fetch(finalUrl, {
      headers: {
        "x-uprodit-appid": appid,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Uprodit API error:", text);
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
