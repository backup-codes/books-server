
const mongoose = require("mongoose");
const stockOut = mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required:true
    },
    commodity: {
        type: String,
      required:true  
    },
    previousStock: {
        type: Number,
      required:true  
    },
    stockOutward: {
        type: Number,
      required:true  
    },
    balanceStock: {
        type: Number,
      required:true  
    },
  // amount: {
  //   type: Number,
  //   required:true
  // },
  restaurant: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:"Restaurant"
    
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("stockOut", stockOut);
