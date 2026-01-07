const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(express.static(path.join(__dirname, 'public')));

// مسار لفحص الحالة - اختبره عبر المتصفح لاحقاً
app.get('/api/health', (req, res) => res.json({ status: "ok" }));

app.post('/api/auth/register', async (req, res) => {
    const { username, email } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (username, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username RETURNING *",
            [username, email]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Database error" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
