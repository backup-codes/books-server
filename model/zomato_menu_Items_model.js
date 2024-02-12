const mongoose = require("mongoose");
const Zomato = mongoose.Schema({
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
    required:true
  },
  discountPrice: {
    type: Number,
    // required:true
  },
  discountPercentage: {
    type: Number,
    // required:true
  },
  platformName: {
    type: String,
    default: "Zomato",
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
  publish:{ 
    type: Boolean,
    default: false,
  },
  quantity: {
    type: Number,
    required:true

  },

  date: {
    type: Date,
    default: Date.now,
  },
},{timestamps:true});

module.exports = mongoose.model("Zomato", Zomato,"Zomato-menu-items");
