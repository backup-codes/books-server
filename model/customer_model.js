const mongoose = require("mongoose");
const customers = mongoose.Schema({
  customer: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  
  email: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipcode: {
    type: Number,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  aadharImage: {
    type:[String],
    required: true,
  },

  aadharNumber: {
    type: String,
    required: true,
  },
  restaurant: {
    type: mongoose.Types.ObjectId,
    required:true
  }

});

module.exports = mongoose.model("Customers", customers);
