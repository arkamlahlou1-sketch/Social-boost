const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API for Leaderboard (Static example - can be connected to MongoDB later)
app.get('/api/leaderboard', (req, res) => {
    const topUsers = [
        { username: "Alex_99", points: 2550 },
        { username: "Sarah.Boost", points: 1840 },
        { username: "King_Social", points: 1200 }
    ];
    res.json(topUsers);
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for the withdraw page
app.get('/withdraw', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'withdraw.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
