const mongoose = require("mongoose");
const orderSchema = mongoose.Schema({
  orderStation: String,
  orderId: String,
  orderTime: String,
  paymentMethod: String,
  Amount: Number,
  KotItems: [
    {
      id: String,
      quantity: Number,
      item: String,
      price: Number,
      totalItemPrice: Number,
    },
  ],
  restaurantId: {
    type: String,
    ref: "Restaurant",
  },
  posManagerId: String,
  billId: String, 
  date: {
    type: Date,
    default: Date.now,
  },
  orderStatus: String,
  orderMode: {
    type: String,
    enum: ['Zomato','Swiggy','Bromag','Others','takeaway', 'dineIn'], 
    default: 'pending', 
  },
  customerName: String,
  phone: String,
  // capManagerId: {
  //   type: String,
  //   ref: "Restaurant",
  // },
  capManagerId: {
    type: String,
    ref: "AccessedEmployees",
  },
  tableStatus: {
    type: String,
  },
  tableNumber: {
    type: String,
    ref: "RestaurantTable",

  },
  status: String,
  tableId: {
    type: String,
    ref: "RestaurantTable",
  },
});

module.exports = mongoose.model("Order", orderSchema);
