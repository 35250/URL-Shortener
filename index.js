const express = require("express");

const app = express();

app.use(express.json());

let nextId = 1;

const idToUrl = {};

const urlToId = {};

function generateShortCode(id) {
    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let shortCode = "";

    while (id > 0) {
        const remainder = id % 62;

        shortCode = chars[remainder] + shortCode;

        id = Math.floor(id / 62);
    }

    return shortCode.padStart(6, "a");
}

app.post("/shorten", (req, res) => {
    const originalUrl = req.body.url;

    if (!originalUrl) {
        return res.status(400).json({
            error: "URL is required"
        });
    }

    if (urlToId[originalUrl]) {
        const existingId = urlToId[originalUrl];

        const existingShortCode =
            generateShortCode(existingId);

        return res.json({
            shortUrl:
                `http://localhost:3000/${existingShortCode}`
        });
    }

    const id = nextId;

    idToUrl[id] = originalUrl;

    urlToId[originalUrl] = id;

    const shortCode = generateShortCode(id);

    nextId++;

    res.json({
        shortUrl:
            `http://localhost:3000/${shortCode}`
    });
});

function getIdFromShortCode(shortCode) {
    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let id = 0;

    for (let i = 0; i < shortCode.length; i++) {
        const value = chars.indexOf(shortCode[i]);

        id = id * 62 + value;
    }

    return id;
}

app.get("/:shortCode", (req, res) => {
    const shortCode = req.params.shortCode;

    const id = getIdFromShortCode(shortCode);

    const originalUrl = idToUrl[id];

    if (!originalUrl) {
        return res.status(404).send("URL not found");
    }

    res.redirect(originalUrl);
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
