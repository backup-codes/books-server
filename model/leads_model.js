const mongoose = require("mongoose");
const leads = mongoose.Schema({
  customerName: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  dob: {
    type: String,
  },
  maritalStatus: {
    type: String,
  },
  anniversaryDate: {
    type: String,
  },
  restaurant: {
    type: String,
    ref: "Restaurant",
  },
  posManagerId: {
    type: String,
    ref: "AccessedEmployees",
  },
  captainId: {
    type: String,
    ref: "AccessedEmployees",
  },
});

module.exports = mongoose.model("Leads", leads);
