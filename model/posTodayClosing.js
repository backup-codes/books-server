
const mongoose = require("mongoose");

const cashDenominationSchema = new mongoose.Schema({
  label: String,
  count: Number
});
const posTodayClosing = mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  restaurant: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:"Restaurant"
    
},
totalOrder: {
    type:Number ,
    required: true,
    
},
totalAmount: {
    type:Number ,
    required: true,
    
},
totalAmountSwiggyOrder: {
    type:Number ,
    required: true,
    
},
totalAmountZomatoOrder: {
    type:Number ,
    required: true,
    
},
totalAmountBromagOrder: {
    type:Number ,
    required: true,
    
},
totalAmountOthersOrder: {
    type:Number ,
    required: true,
    
},
totalAmountTakeaway: {
    type:Number ,
    required: true,
    
},
totalOrderUPI: {
    type:Number ,
    required: true,
    
},
// totalAmountDinein: {
//     type:Number ,
//     required: true,
    
// },
cashDenomination: {
  type: [cashDenominationSchema],
  required: true,
},
bill:{
  type: [String],
  required:true
  },
  posId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref:"AccessedEmployees"
}

}, {
  timestamps: true, 
});

module.exports = mongoose.model("posTodayClosing", posTodayClosing);
