const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    points: { type: Number, default: 0 },
    usedCodes: [String],
    socialId: String
});

module.exports = mongoose.model('User', userSchema);
