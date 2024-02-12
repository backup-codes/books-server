
const mongoose = require("mongoose");
const stockIn = mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
    commodity: {
        type: String,
      required:true  
    },
    stockInward: {
        type: Number,
      required:true  
    },
    VendorId: {
        type: mongoose.Types.ObjectId,
      required: true  ,
      red:"Venders"
    },
  amount: {
    type: Number,
    required:true
  },
  unit: {
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
}, {
  timestamps: true
});

module.exports = mongoose.model("stockIn", stockIn);
