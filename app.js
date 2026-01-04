const express = require('express');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const path = require('path');
const User = require('./model/User'); // تأكد أن المجلد في GitHub اسمه model (بدون s) كما في صورتك

const app = express();

// إعدادات السيرفر
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. الربط بقاعدة البيانات (MongoDB Atlas)
// سيستخدم الرابط الذي وضعته في إعدادات Render باسم DATABASE_URL
const dbURI = process.env.DATABASE_URL;

mongoose.connect(dbURI)
    .then(() => console.log("✅ متصل بنجاح بقاعدة بيانات MongoDB Atlas"))
    .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// 2. مسار عرض الصفحة الرئيسية (حل مشكلة عدم ظهور الموقع)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. مسار التحقق من المتابعة وإضافة النقاط
app.post('/api/verify', async (req, res) => {
    const { userId, targetProfile, usernameToCheck } = req.body;

    let browser;
    try {
        // تشغيل المتصفح بإعدادات تتوافق مع سيرفرات Render
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        
        // التوجه لبروفايل الشخص
        await page.goto(`https://www.socialplatform.com/${targetProfile}`, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        const content = await page.content();
        const isFollowing = content.includes(usernameToCheck);
        
        await browser.close();

        if (isFollowing) {
            // تحديث النقاط في قاعدة البيانات
            const user = await User.findByIdAndUpdate(
                userId, 
                { $inc: { points: 10 } }, 
                { new: true }
            );
            return res.json({ success: true, newPoints: user.points });
        } else {
            return res.json({ success: false, message: "لم نجد اسمك في قائمة المتابعين!" });
        }

    } catch (err) {
        if (browser) await browser.close();
        console.error("خطأ أثناء الفحص:", err);
        res.status(500).json({ success: false, message: "حدث خطأ فني أثناء التحقق" });
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل الآن على الرابط: http://localhost:${PORT}`);
});
