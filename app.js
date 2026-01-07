const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// 1. تفعيل CORS للسماح بالاتصال من GitHub Pages
app.use(cors());
app.use(express.json());

// 2. إعداد الاتصال بقاعدة البيانات (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 3. خدمة الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoints ---

// تسجيل مستخدم جديد أو تسجيل الدخول
app.post('/api/auth/register', async (req, res) => {
    const { username, email } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO users (username, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username RETURNING *",
            [username, email]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "خطأ في عملية التسجيل" });
    }
});

// جلب بيانات مستخدم (الرصيد)
app.get('/api/user/:id', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username, points_balance FROM users WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "المستخدم غير موجود" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب بيانات المستخدم" });
    }
});

// جلب المهام المتاحة
app.get('/api/tasks/:userId', async (req, res) => {
    try {
        const tasks = await pool.query(`
            SELECT * FROM tasks 
            WHERE status = 'active' 
            AND user_id != $1 
            AND current_follows < required_follows
        `, [req.params.userId]);
        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب المهام" });
    }
});

// التحقق من المهمة وإضافة النقاط
app.post('/api/tasks/verify', async (req, res) => {
    const { userId, taskId } = req.body;
    try {
        // تحديث نقاط المستخدم (كمثال نضيف 10 نقاط)
        const updateResult = await pool.query(
            "UPDATE users SET points_balance = points_balance + 10 WHERE id = $1 RETURNING points_balance",
            [userId]
        );
        res.json({ success: true, new_points: updateResult.rows[0].points_balance });
    } catch (err) {
        res.status(500).json({ success: false, error: "فشل التحقق" });
    }
});

// قائمة المتصدرين (ديناميكية من قاعدة البيانات)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await pool.query("SELECT username, points_balance as points FROM users ORDER BY points_balance DESC LIMIT 5");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب المتصدرين" });
    }
});

// --- Routes للملفات ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/withdraw', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'withdraw.html'));
});

// تشغيل الخادم
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
