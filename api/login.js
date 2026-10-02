const { veiligGelijk, maakSessie, cors } = require("./_gedeeld");

module.exports = async (req, res) => {
    if (cors(req, res)) return;

    const { email, wachtwoord } = req.body || {};
    const juisteEmail = process.env.ADMIN_EMAIL || "";
    const juisteWachtwoord = process.env.ADMIN_PASSWORD || "";

    if (!juisteEmail || !juisteWachtwoord || !process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: "De inlogdienst is nog niet ingesteld." });
    }

    const klopt =
        email && wachtwoord &&
        veiligGelijk(String(email).toLowerCase().trim(), juisteEmail.toLowerCase().trim()) &&
        veiligGelijk(wachtwoord, juisteWachtwoord);

    if (!klopt) {
        // Even wachten maakt eindeloos wachtwoorden raden een stuk trager.
        await new Promise((r) => setTimeout(r, 1000));
        return res.status(401).json({ error: "Ongeldige inloggegevens" });
    }

    res.json({ sessie: maakSessie() });
};
