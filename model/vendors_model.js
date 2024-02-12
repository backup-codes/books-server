const mongoose = require("mongoose");
const venders = mongoose.Schema({
  ingredient: {
    type: String,
    ref:"Ingredients"
  },
  vendorId: {
    type: String,
    required: true,
  },
  vendorName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required:true
  },
  billImage:{
    type: String,
    required:true
    
  },
  gst: {
    type: String,
    required:true
  },
  neft: {
    type: String,
    required:true
  },
  branchCode: {
    type: String,
    required:true
  },
  accountNumber: {
    type: String,
    required:true
  },
  addedDate:{
    type: Date,
    default: Date.now,
  },
  restaurant:{
    type:String,
    ref:"Restaurant"
  }
});

module.exports = mongoose.model("Venders", venders);
