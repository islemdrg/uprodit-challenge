const express = require("express");
const cors = require("cors");
const hmacsha1 = require("hmacsha1");
const uuid = require("uuid");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.static("public"));

const appid = "challenge_uprodit";
const env = "production";

function generateSignature(appid, env, uri) {
  const auth_signature_method = "HMAC-SHA1";
  const auth_consumer_key = encodeURIComponent(hmacsha1(appid, env));
  const auth_token = uuid.v4();
  const uri_path = uri.replace(new RegExp("http(s)?://[^/]*"), "");
  const auth_signature = encodeURIComponent(
    hmacsha1(appid, uri_path + auth_token)
  );
  const auth_nonce = encodeURIComponent(hmacsha1(appid, uuid.v4()));
  const auth_callback = encodeURIComponent(uri_path);
  const auth_timestamp = new Date().getTime();

  return `?auth_signature=${auth_signature}&auth_nonce=${auth_nonce}&auth_callback=${auth_callback}&auth_timestamp=${auth_timestamp}&auth_token=${auth_token}&auth_signature_method=${auth_signature_method}&auth_consumer_key=${auth_consumer_key}`;
}

app.get("/api/profiles", async (req, res) => {
  const baseUrl = "https://api.uprodit.com/v1/profile/all";
  const params = "?startIndex=0&maxResults=12";
  const fullUrl = baseUrl + params;
  const signature = generateSignature(appid, env, fullUrl);

  const finalUrl = fullUrl + "&" + signature.substring(1);

  try {
    const response = await fetch(finalUrl, {
      headers: {
        "x-uprodit-appid": appid,
      },
    });

    console.log("API status:", response.status);
    const data = await response.json();
    console.log("API response:", data);
    res.json(data);

  } catch (error) {
    console.error("API Error detail:", error);
    res.status(500).json({ error: "API request failed", detail: error.message });
  }
});

fetch("/api/profiles")
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("profiles");
        if (!data || !data.length) {
          container.textContent = "Aucun profil trouvé.";
        } else {
          container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
      })
      .catch(err => {
        console.error("Erreur de chargement des profils:", err);
        document.getElementById("profiles").textContent = "Erreur de chargement des profils.";
      });

app.listen(3000, () => {
  console.log("Proxy server running at http://localhost:3000");
});
