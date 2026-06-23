const express = require("express");
require("dotenv").config();
const { Client } = require("pg");

const {
    PORT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;

const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
});

if (!DB_PASSWORD) {
    throw new Error(
        "DB_PASSWORD is missing."
    );
}

client.connect()
    .then(() => {
        console.log("Connected to PostgreSQL");
    })
    .catch((err) => {
        console.error("Connection failed", err);
    });

const app = express();

app.use(express.json());

function generateShortCode(id) {
    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let shortCode = "";

    // Converts a numeric ID into a fixed-length Base62 shortcode.
    while (id > 0) {
        const remainder = id % 62;

        shortCode = chars[remainder] + shortCode;

        id = Math.floor(id / 62);
    }

    return shortCode.padStart(6, "a");
}

app.post("/shorten", async (req, res) => {
    try{
        const originalUrl = req.body.url;

        if (!originalUrl) {
            return res.status(400).json({
                error: "URL is required"
            });
        }

        const result = await client.query(
        `
        SELECT id
        FROM urls
        WHERE original_url = $1
        `,
        [originalUrl]
        );

        if (result.rows.length > 0) {
        const existingId =
            Number(result.rows[0].id);

        const existingShortCode =
            generateShortCode(existingId);

        return res.json({
            shortUrl:
                `${process.env.BASE_URL}/${existingShortCode}`
        });
        }

        const insertResult = await client.query(
        `
        INSERT INTO urls (original_url)
        VALUES ($1)
        RETURNING id
        `,
        [originalUrl]
        );

        const newId =
        Number(insertResult.rows[0].id);

        const shortCode =
        generateShortCode(newId);

        res.json({
        shortUrl:
            `${process.env.BASE_URL}/${shortCode}`
        });
    
    }catch(err){
        console.error(err);
        res.status(500).json({
        error: "Something went wrong. Please try again later."
        });
    }
});

function getIdFromShortCode(shortCode) {
    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let id = 0;
    
    // Converts a fixed-length Base62 shortcode into a numeric ID.
    for (let i = 0; i < shortCode.length; i++) {
        const value = chars.indexOf(shortCode[i]);

        id = id * 62 + value;
    }

    return id;
}

app.get("/:shortCode", async(req, res) => {
    try{
        const shortCode = req.params.shortCode;

        const id = getIdFromShortCode(shortCode);

        const result= await client.query(
            ` 
            SELECT original_url
            FROM urls
            WHERE id= $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("URL not found");
        }

        const originalUrl= result.rows[0].original_url;
        res.redirect(originalUrl);
    
    }catch(err){
        console.error(err);
        res.status(500).json({
        error: "Something went wrong. Please try again later."
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
