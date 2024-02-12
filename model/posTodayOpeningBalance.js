const mongoose = require("mongoose");

const cashDenominationSchema = new mongoose.Schema({
    label: String,
    count: Number
  });
  

const posTodayOpeningBalanceSchema = mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    totalAmount: {
        type: String,
        required: true,
        
    },
    restaurant: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref:"Restaurant"
        
    },

    cashDenomination: {
        type: [cashDenominationSchema],
        required: true,
    },
    
    posId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref:"AccessedEmployees"
    }
}, {
    timestamps: true, 
  })

const PosTodayOpeningBalanceModel = mongoose.model('PosTodayOpeningBalance', posTodayOpeningBalanceSchema);

module.exports = PosTodayOpeningBalanceModel;