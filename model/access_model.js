const mongoose = require("mongoose");
const accessedEmployees = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
  },
  accessFor: {
    type: String,
    
  },
  adminStatus:{
    type:Boolean,
    default:false
  },
  restaurant:{
    type:String,
    ref:"Restaurant"
  },
  profileImage: {
    type: String,
    required:true
  }
});

module.exports = mongoose.model("AccessedEmployees", accessedEmployees);
