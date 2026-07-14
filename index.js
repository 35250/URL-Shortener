const express = require("express");
require("dotenv").config();
const { Pool } = require("pg");

const {
    PORT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    BASE_URL 
} = process.env;

const pool = new Pool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
});

if (!DB_PASSWORD) {
    throw new Error(
        "DB_PASSWORD is missing."
    );
}

async function startServer() {
    try {
        await pool.query("SELECT 1");

        console.log("Connected to PostgreSQL");

        app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        });

    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
}

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send(`
        <html>
        <body style="font-family:Arial, sans-serif; padding:20px;">
            <h2>URL Shortener API</h2>

            <p>Status: Live</p>

            <p>Available Endpoints</p>

            <ul>
                <li>POST /shorten</li>
                <li>GET /:shortCode</li>
            </ul>
        </body>
        </html>
    `);
});

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

        let parsedUrl;

        try {
            parsedUrl = new URL(originalUrl);
        } catch {
            return res.status(400).json({
                error: "Invalid URL"
            });
        }
        
        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {
            return res.status(400).json({
                error: "Only HTTP and HTTPS URLs are supported"
            });
        }

        const result = await pool.query(
        `
        INSERT INTO urls (original_url)
        VALUES ($1)
        ON CONFLICT (original_url)
        DO UPDATE
        SET original_url = EXCLUDED.original_url
        RETURNING id;
        `,
        [originalUrl]
        );
        
        const id = Number(result.rows[0].id);
        
        const shortCode = generateShortCode(id);
        
        return res.json({
            shortUrl: `${BASE_URL}/${shortCode}`
        });
    
    }catch(err){
        console.error("POST /shorten failed:", err);
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

        const result= await pool.query(
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
        console.error("GET /:shortCode failed:", err);
        res.status(500).json({
        error: "Something went wrong. Please try again later."
        });
    }
});

startServer();
