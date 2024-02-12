const mongoose = require("mongoose");
const CustomerBill = mongoose.Schema({
    customer:{
        type:mongoose.Types.ObjectId,
        ref:"Customers"
      },
      restaurant:{
        type:mongoose.Types.ObjectId,
        ref:"Restaurant"
      },
  limit: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },

  BillImage: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    required: true,
    },
    employe: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref:"AccessedEmployees"
  }
});

module.exports = mongoose.model("CustomerBil", CustomerBill);
