const express = require('express');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const User = require('./models/User');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// الاتصال بـ MongoDB Atlas (استخدم متغير بيئة للأمان)
const dbURI = process.env.DATABASE_URL || 'mongodb://localhost:27017/followersDB';
mongoose.connect(dbURI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.log(err));

// مسار التحقق من المتابعة وإضافة النقاط
app.post('/api/verify', async (req, res) => {
    const { userId, targetProfile, usernameToCheck } = req.body;

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(`https://www.socialplatform.com/${targetProfile}`);
        
        const content = await page.content();
        const isFollowing = content.includes(usernameToCheck);
        await browser.close();

        if (isFollowing) {
            const user = await User.findByIdAndUpdate(userId, { $inc: { points: 10 } }, { new: true });
            res.json({ success: true, newPoints: user.points });
        } else {
            res.json({ success: false, message: "لم نجد متابعة بعد" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
