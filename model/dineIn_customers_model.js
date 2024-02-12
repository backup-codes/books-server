const mongoose = require("mongoose");
const dineInCustomers = mongoose.Schema({
  customerName: {
    type: String,
  },
  phone: {
    type: Number,
  },
  tableName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantTable",
  },  
  status: {

    type: String,
  },
  restaurant: {
    type: String,
    ref: "Restaurant",
  },
  captainId: {
    type: String,
    ref: "AccessedEmployees",
  },
  orderMode:String,
  KotItems: [
    {
      id: String,
      quantity: Number,
      item: String,
      price: Number,
      totalItemPrice: Number,
    },
  ],
  Amount: {
    type: Number,
  },

});

module.exports = mongoose.model("DineInCustomers", dineInCustomers);
