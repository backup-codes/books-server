const mongoose = require("mongoose");
const restaurantTable = mongoose.Schema({
  tableName: {
    type: String,
    required: true,
  },
  numberOfSeats: {
    type: String,
    required: true,
  },
  restaurant: {
    type: String,
    ref: "Restaurant",
  },
  image: {
    type: String,
    required: true,
  },
  isShared: {
    // status for table sharing
    type: Boolean,
    default: false,
  },
  isBooked: {
    // status for booking
    type: Boolean,
    default: false,
  },
  captainId: {
    // captains
    type: String,
    ref: "AccessedEmployees",
  },
  orderMode: String,
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
  customerName: {
    type: String,
  },
  phone: {
    type: String,
  },
  status: {
    type: String,
    enum: ["book-now", "booked", "holded"],
    default: "book-now",
  },
  orderId: {
    type: String,
  },
  kotStatus: {
    // status for kot list having or not
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("RestaurantTable", restaurantTable);
