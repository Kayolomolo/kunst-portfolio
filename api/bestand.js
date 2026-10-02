const { BRANCH, sessieGeldig, cors, github } = require("./_gedeeld");

// Alleen deze bestanden mag de site aanpassen.
const TOEGESTAAN = /^(data\.json|images\/[A-Za-z0-9._-]+\.jpg)$/;

module.exports = async (req, res) => {
    if (cors(req, res)) return;

    const { sessie, pad, inhoud, verwijder, bericht } = req.body || {};
    if (!sessieGeldig(sessie)) return res.status(401).json({ error: "Log opnieuw in" });
    if (!TOEGESTAAN.test(String(pad || ""))) return res.status(400).json({ error: "Dit bestand mag niet" });

    try {
        const huidig = await github("/contents/" + pad + "?ref=" + BRANCH);
        const sha = huidig.ok ? (await huidig.json()).sha : undefined;

        let antwoord;
        if (verwijder) {
            if (!sha) return res.json({ ok: true });
            antwoord = await github("/contents/" + pad, {
                method: "DELETE",
                body: JSON.stringify({ message: bericht || "Foto verwijderd", sha, branch: BRANCH }),
            });
        } else {
            if (typeof inhoud !== "string" || !inhoud) return res.status(400).json({ error: "Geen inhoud" });
            antwoord = await github("/contents/" + pad, {
                method: "PUT",
                body: JSON.stringify({ message: bericht || "Portfolio bijgewerkt", content: inhoud, branch: BRANCH, ...(sha ? { sha } : {}) }),
            });
        }

        if (!antwoord.ok) return res.status(antwoord.status === 409 ? 409 : 502).json({ error: "GitHub gaf fout " + antwoord.status });
        res.json({ ok: true });
    } catch (e) {
        res.status(502).json({ error: "GitHub niet bereikbaar" });
    }
};
