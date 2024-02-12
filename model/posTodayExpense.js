
const mongoose = require("mongoose");
const posTodayExpense = mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required:true
  },
  amount: {
    type: String,
    required:true
  },
  billURL: {
    type: String,
    required:true
  },

  restaurant: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:"Restaurant"
    
  },
  posId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:"AccessedEmployees"
}
}, {
  timestamps: true
});

module.exports = mongoose.model("PosTodayExpense", posTodayExpense);
