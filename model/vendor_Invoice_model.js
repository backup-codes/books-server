const mongoose = require("mongoose");
const VendorInvoice = mongoose.Schema({
  vendorId: {
    type: mongoose.Types.ObjectId,
    ref: "Venders",
  },
  vendorName: {
    type: String,
    required:true
  },
  description: {
      type: String,
      required:true
  },
  amount: {
      type: Number,
      required:true
      
  },
  paymentMode: {
      type: String,
      required:true
      
  },
  billImage: {
      type: String,
      required:true
      
  },
  restaurant: {
    type: mongoose.Types.ObjectId,
    ref: "Restaurant",
  },
  commodities: [
    {
      commodity: {
        type: String,
        required: true,
      },
      TotalCommodityAmount: {
        type: Number,
        required: true,
      },
      Quantity: {
        type: Number,
        required: true,
          },
          Unit: {
              type: String,
              required:true
      },
      CommodityAmount: {
        type: Number,
        required:true
      },
      GstAmount: {
        type: Number,
        required:true
      }
    },
  ]
  
}, { timestamps: true} );

module.exports = mongoose.model("VendorInvoice", VendorInvoice,"VendorInvoice");
