const mongoose = require("mongoose");
const feedback = mongoose.Schema({
    name: String,
    email: String,
    phoneNumber: String,
    message: String,
});

module.exports = mongoose.model("Feedback", feedback);
