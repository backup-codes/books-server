const mongoose = require("mongoose");
const menuCategory = mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  subcategory: {
    type: [String],
    required: true,
  },
  restaurant:{
    type:String,
    ref:"Restaurant"
  }
});

module.exports = mongoose.model("MenuCategory", menuCategory);
