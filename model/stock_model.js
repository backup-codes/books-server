
const mongoose = require("mongoose");
const stock = mongoose.Schema({
    commodityName: {
    type: String,
    required:true
  },
  quantity: {
    type: Number,
    required:true
  },
  unit: {
    type: String,
    required:true
  },
  restaurant: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:"Restaurant"
    
  },
}, {
    timestamps: true, 
  });

module.exports = mongoose.model("Stocks", stock,"Stocks");
