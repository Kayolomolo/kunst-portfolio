const crypto = require("crypto");

const REPO = "Kayolomolo/kunst-portfolio";
const BRANCH = "main";
const TOEGESTANE_SITE = "https://kayolomolo.github.io";
const DERTIG_DAGEN = 30 * 24 * 60 * 60 * 1000;

// Geheime sleutel om sessies te ondertekenen. Afgeleid van het wachtwoord en de
// GitHub-sleutel, dus als je één van beide wijzigt, moet iedereen opnieuw inloggen.
function geheim() {
    return crypto.createHash("sha256")
        .update((process.env.GITHUB_TOKEN || "") + "|" + (process.env.ADMIN_PASSWORD || ""))
        .digest();
}

function veiligGelijk(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function maakSessie() {
    const verloopt = String(Date.now() + DERTIG_DAGEN);
    const handtekening = crypto.createHmac("sha256", geheim()).update(verloopt).digest("hex");
    return verloopt + "." + handtekening;
}

function sessieGeldig(sessie) {
    const [verloopt, handtekening] = String(sessie || "").split(".");
    if (!verloopt || !handtekening) return false;
    const juist = crypto.createHmac("sha256", geheim()).update(verloopt).digest("hex");
    return veiligGelijk(handtekening, juist) && Number(verloopt) > Date.now();
}

// Laat alleen de portfolio-site met deze dienst praten.
function cors(req, res) {
    res.setHeader("Access-Control-Allow-Origin", TOEGESTANE_SITE);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") { res.status(204).end(); return true; }
    if (req.method !== "POST") { res.status(405).json({ error: "Alleen POST" }); return true; }
    return false;
}

function github(pad, opties = {}) {
    return fetch("https://api.github.com/repos/" + REPO + pad, {
        ...opties,
        headers: {
            Authorization: "Bearer " + process.env.GITHUB_TOKEN,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "kunst-portfolio-login",
        },
    });
}

module.exports = { REPO, BRANCH, veiligGelijk, maakSessie, sessieGeldig, cors, github };
