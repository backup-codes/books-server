const mongoose = require("mongoose");
const menu = mongoose.Schema({
  item: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: true,
  },
  actualPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
  },
  discountPercentage: {
    type: Number,
  },
  platformName: {
    type: String,
    required: true,
  },
  itemImage: {
    type: String,
  },
  category: {
    type: String,
    ref: "MenuCategory",
    required: true,
  },
  isShared: { // status for item sharing
    type: Boolean,
    default: false,
  },
  restaurant:{
    type:String,
    ref:"Restaurant"
  },
  menuShared:{ // status for category sharing
    type: Boolean,
    default: true,
  },
  publish:{ // status for publish menu
    type: Boolean,
    default: false,
  },
  quantity: {
    type: Number,
    default:0
  },

  date: {
    type: Date,
    // default: Date.now,
  },
},{timestamps:true});

module.exports = mongoose.model("Menu", menu);
