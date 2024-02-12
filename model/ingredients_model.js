const mongoose = require("mongoose");
const ingredients = mongoose.Schema({
  ingredient: {
    type: String,
    required: true,
  },

  vendorId: {
    type: String,
    ref: "Venders",
  },
  vendorName: {
    type: String,
    required: true,
  },
  vendorPhone: {
    type: String,
  },
  description: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
  },
  paymentType: {
    type: String,
  },
  billImage: {
    type: String,
  },
  restaurant: {
    type: String,
    ref: "Restaurant",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  commodities: [
    {
      commodity: {
        type: String,
        required: true,
      },
      Quantity: {
        type: Number,
        required: true,
      },
    },
  ]
  
});

module.exports = mongoose.model("Ingredients", ingredients);
