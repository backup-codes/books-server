const RestaurantTable = require("../model/restaurant_table_model");
const AccessedEmployees = require("../model/access_model");
const MenuCategory = require("../model/menuCategory_model");
const Menu = require("../model/menu_model");
const { generateBillId } = require("../middleware/bill_ID");
const Order = require("../model/order_model");
const Customerbill = require("../model/customer_bill_model");
const DineInCustomers = require("../model/dineIn_customers_model");
const Customers = require("../model/customer_model");
const Restaurant = require("../model/restaurant_model");
const Leads = require("../model/leads_model");
const helpers = require("../utils/helpers");
const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const restaurant_menu_model = require("../model/restaurant_menu_model");

function generateOrderId() {
  const orderId = uuidv4().replace(/-/g, "").slice(0, 12);
  return orderId;
}

exports.capDashboard = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    if (isRestaurant) {
      if (isPosManager) {

        const managerData = await AccessedEmployees.findOne({
          _id: req.id,
          accessFor: "Captain manager",
          restaurant: isRestaurant,
        });

        const restaurantData = await Restaurant.findOne({ _id: isRestaurant });
        res.status(200).json({
          success: true,
          ManagerData: managerData,
          RestaurantData: restaurantData,
        });
        
      } else {
        res.json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
 return   res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

exports.tableBooking = async (req, res) => {
  try {
    const { customerName, phone, orderMode, tableId } = req.body;
    const restaurant = req.restaurant;
    const validCap = req.id;

    if (!restaurant || !validCap) {
      return res.json({ success: false, message: "Session expired!" });
    }

    const orderId = generateOrderId();

    console.log();
    const updatedTable = await RestaurantTable.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(tableId), restaurant: restaurant },
      {
        isBooked: true,
        customerName: customerName,
        orderId: orderId,
        phone: phone,
        status: "booked",
        orderMode: orderMode,
      },
      { new: true }
    );

    if (!updatedTable) {
      return res.json({
        success: false,
        message: "Table not found or could not be updated.",
      });
    }

    const existingLead = await Leads.findOne({
      phone,
      restaurant: restaurant,
      captainId: validCap,
    });

    let leadResponse;

    if (!existingLead) {
      const newLeadData = new Leads({
        customerName: customerName,
        phone: phone,
        restaurant: restaurant,
        captainId: validCap,
      });

      await newLeadData.save();
      leadResponse = {
        success: true,
        message: "Customer data recorded to Lead!",
      };
    } else {
      leadResponse = {
        success: false,
        message: "Lead already exists for this customer.",
      };
    }

    res.json({
      success: true,
      message: `Table booked by ${customerName}`,
      leadResponse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.addCustomerBill = async (req, res) => {
  try {
    const { amount, date, name, phone } = req.body;

    const restaurant = req.restaurant;
    const captainId = req.id;
    const file = req.file;
    if (req.file) {
      const customerdata = await Customers.findOne({
        customer: name,
        phone: phone,
      });

      if (customerdata) {
        const imagePath = `customer/customerBill/${restaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        const imageURL = helpers.getS3FileUrl(imagePath);

        helpers.deleteFile(file.path);

        if (amount <= customerdata.limit) {
          const balance = customerdata.limit - amount;

          const BillData = {
            customer: customerdata._id,
            employe: captainId,
            amount: amount,
            date: new Date(date),
            BillImage: imageURL,
            balance: balance,
            limit: customerdata.limit,
            restaurant: restaurant,
          };

          const Bill = new Customerbill(BillData);

          await Bill.save();

          await Customers.updateOne(
            { _id: customerdata._id },
            { $set: { limit: balance } }
          );

          res.status(200).json({
            success: true,
            message: "Customer Bill successfully added",
          });
        } else {
          res.status(200).json({
            success: false,
            message: "Enter amount lesser than or equal to limit",
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.getAllcustomerBill = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (restaurant) {
      const BillData = await Customerbill.find({
        restaurant: restaurant,
      }).populate("customer").sort({date:-1});
      res.status(200).json({ success: true, BillData: BillData });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

exports.captainDashboard = async (req, res) => {
  try {
    console.log("here i'm");

    const isRestaurant = req.restaurant;
    const isCaptain = req.id;

    if (isRestaurant) {
      if (isCaptain) {
        const managerData = await AccessedEmployees.findOne({
          _id: req.id,
          accessFor: "Captain manager",
          restaurant: isRestaurant,
        });
  

        const restaurantData = await Restaurant.findOne({ _id: isRestaurant });

        res.status(200).json({
          success: true,
          ManagerData: managerData,
          RestaurantData: restaurantData,
        });
      } else {
        res.json({ success: false, message: "Session expired!" });
      }
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getTableStatus = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;
    if (isRestaurant) {
      if (isCaptain) {
        const captain = await AccessedEmployees.findOne(
          { _id: isCaptain },
          { username: 1 }
        );

        if (captain) {
          const { username } = captain;
          const tableData = await RestaurantTable.find({
            captainId: username,
            restaurant: isRestaurant,
            isShared: true,
          });

          res.status(200).json({ success: true, tableData });
        } else {
          console.log("Captain not found");
        }
      } else {
        res.json({ success: false, message: "Session expired!" });
      }
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getMenuDataAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;
    if (isRestaurant) {
      if (isCaptain) {
        const menuData = await restaurant_menu_model.find({
          restaurant: isRestaurant,
          isShared: true,
          menuShared: true,
          publish: true,
        });

console.log(menuData,"i am n=menu data");

        const categories = await MenuCategory.find({
          restaurant: isRestaurant,
        });
        const result = await RestaurantTable.find({
          "KotItems.0": { $exists: true },
        });

        const isKotExist = result.length > 0;
        res.status(200).json({
          success: true,
          MenuData: menuData,
          Categories: categories,
          isKotExist,
        });
      } else {
        res
          .status(200)
          .json({ success: false, message: "Captain session expired" });
      }
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.printBillAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCapManager = req.id;
    const orderData = req.body;
    const tableId = orderData._id;
    const orderId = orderData.orderId;

    if (isRestaurant && isCapManager) {
      // Check if the order with the given orderId already exists
      const existingOrder = await Order.findOne({ orderId });

      if (existingOrder) {
        // If the order exists, here updating it by pushing KotItems
        existingOrder.KotItems.push(...orderData.KotItems);
        existingOrder.Amount = existingOrder.KotItems.reduce(
          (total, item) => total + item.totalItemPrice,
          0
        );

        await existingOrder.save();
        if (existingOrder) {
          const update = {
            $unset: {
              KotItems: 1,
            },
          };

          const result = await RestaurantTable.findOneAndUpdate(
            { _id: tableId },
            update,
            { new: true }
          );

          console.log("Updated Document:", result);

          res
            .status(200)
            .json({ success: true, message: "Bill successfully sent to POS" });
        }
      } else {
        const billId = generateBillId();

        const newOrder = new Order({
          customerName: orderData.customerName,
          phone: orderData.phone,
          tableNumber: orderData.tableName,
          tableId,
          KotItems: orderData.KotItems || [],
          Amount: orderData.Amount,
          billId,
          orderId,
          restaurantId: isRestaurant,
          capManagerId: isCapManager,
          orderMode: orderData.orderMode,
        });

        const savedOrder = await newOrder.save();

        if (savedOrder) {
          const update = {
            $unset: {
              KotItems: 1,
            },
          };

          const result = await RestaurantTable.findOneAndUpdate(
            { _id: tableId },
            update,
            { new: true }
          );

          console.log("Updated Document:", result);

          res
            .status(200)
            .json({ success: true, message: "Bill successfully sent to POS" });
        }
      }
    } else {
      res.status(401).json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

async function decrementMenuItemQuantity(modelName, restaurantId, itemName, quantityToDecrement) {
  try {
    // Get the appropriate model based on the provided modelName
    const MenuItemModel = mongoose.model(modelName);

    console.log(MenuItemModel,"MenuItemModel");


    // Find the menu item based on restaurantId and itemName
    const menuItem = await MenuItemModel.findOne({
      restaurant: restaurantId,
      item: itemName,
    });

    if (!menuItem) {
      console.log(`Menu item ${itemName} not found in ${modelName} ${restaurantId}`);
      return; // Exit the function if the item is not found
    }

    // Check if there is enough quantity to decrement
    if (menuItem.quantity < quantityToDecrement) {
      console.error('Not enough quantity to decrement');
      return;
    }

    
    // Update the quantity by decrementing
console.log(quantityToDecrement,"i am decreater");
    menuItem.quantity -= +quantityToDecrement;

    // Save the updated menu item
    await menuItem.save();

    console.log(`Quantity decremented for ${itemName} in ${modelName} restaurant ${restaurantId}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

exports.KotOrdersAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCapManager = req.id;

    const KotItems = req.body.kotData;
    const tableBookedId = req.body.orderData._id;
    console.log(tableBookedId, "tableBookedId");
    if (isRestaurant) {
      if (isCapManager) {
        await RestaurantTable.updateOne(
          { _id: tableBookedId },
          {
            $push: { KotItems: KotItems },
            $set: { orderMode: "dineIn", kotStatus: true },
          }
        );

        console.log(KotItems,"i am kotitems");
        

        const updatedOrder = await RestaurantTable.findOne({
          _id: tableBookedId,
        });

        if (updatedOrder && updatedOrder.KotItems) {
          const totalAmount = updatedOrder.KotItems.reduce(
            (accumulator, item) => accumulator + item.totalItemPrice,
            0
          );

          await RestaurantTable.updateOne(
            { _id: tableBookedId },
            { Amount: totalAmount }
          );


          KotItems.map((item,index) => {
            decrementMenuItemQuantity('Bromag', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('Swiggy', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('Zomato', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('OthersMenu', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('restaurantMenu', isRestaurant, item.item, item.quantity);
             
           })

          res.status(200).json({
            success: true,
            message: "Kitchen to order recorded!",
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Error: Could not find or update the order.",
          });
        }
      } else {
        res.status(200).json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.status(200).json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.holdItemsAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCapManager = req.id;
    const { orderMode, customerName, phone, status, tableName } =
      req.body.orderData;
    const tableBookedId = req.body.orderData._id;
    if (isRestaurant) {
      if (isCapManager) {
        await RestaurantTable.updateOne(
          { _id: tableBookedId },
          {
            status: "holded",
          }
        );

        const updatedOrder = await RestaurantTable.findOne({
          _id: tableBookedId,
        });
        const totalAmount = updatedOrder.KotItems.reduce(
          (accumulator, item) => accumulator + item.totalItemPrice,
          0
        );

        await RestaurantTable.updateOne(
          { _id: tableBookedId },
          { Amount: totalAmount }
        );
        res.json({
          success: true,
          updatedOrder,
          message: `${customerName}'s order is on hold!`,
        });
      } else {
        res.json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getOrderedDataAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;

    const tableId = req.params.kotId;
    if (isRestaurant) {
      if (isCaptain) {
        const captain = await AccessedEmployees.findOne(
          { _id: isCaptain },
          { username: 1 }
        );

        if (captain) {
          const { username } = captain;
          const orderedData = await RestaurantTable.find({
            _id: tableId,
            restaurant: isRestaurant,
            captainId: username,
            // $expr: { $gt: [{ $size: "$KotItems" }, 0] },
            kotStatus: true,
            orderId: { $exists: true, $ne: null },
          });

          console.log(orderedData, "orderedData");
          res.status(200).json({
            success: true,
            orderedData,
          });
        } else {
          console.log("Captain not found");
        }
      } else {
        res.json({ success: false, message: "Cap session expired" });
      }
    } else {
      res.json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.cancelTable = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;

    const tableId = req.params.tableId;
    console.log(tableId, "table id");
    if (isRestaurant) {
      if (isCaptain) {
        const validRestaurantTable = await RestaurantTable.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(tableId),
            restaurant: isRestaurant,
          },
          { isBooked: false }, // here only updating the status, having doubt about the customers data ? when a next customer come out those other fields with be automatically set again. so dont worry about that
          { new: true }
        );
        res.json({
          success: true,
        });
      } else {
        res.json({ success: false, message: "Cap session expired" });
      }
    } else {
      res.json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
  }
};


exports.getTableDetails = async (req, res) => {
  try {
    const { tableId } = req.params
    
const restaurantId = req.restaurant
    console.log(tableId);
    const tableData = await RestaurantTable.findOne({restaurant: restaurantId, _id: tableId });
    if (tableData) {
  
      return res.status(200).json({success:true,message:"Successfully fetched",tableData})
    } else {
      return res.status(200).json({success:false,message:"Unable to fetch table data"})
    }
    
  } catch (err) {
    console.log(err)
  return  res.status(500).json({ success: false, message: "session expired" });

    
  }
}

exports.captainDashboard = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;
    if (isRestaurant) {
      if (isCaptain) {
        const managerData = await Restaurant.findOne({
          _id: isRestaurant,
          accessFor: "Captain manager",
          restaurant: isRestaurant,
        });
        res.status(200).json({ success: true, ManagerData: managerData });
      } else {
        res.json({ success: false, message: "Session expired!" });
      }
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.addLeadsAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;
    console.log(req.body);
    const { customerName, phone, email, maritalStatus, dob, anniversaryDate } =
      req.body;
    if (isRestaurant) {
      if (isCaptain) {
        const newLeadData = new Leads({
          customerName: customerName,
          phone: phone,
          email: email,
          dob: dob,
          maritalStatus: maritalStatus,
          anniversaryDate: anniversaryDate,
          restaurant: isRestaurant,
          captainId: isCaptain,
        });
        await newLeadData.save();
        res.json({ success: true, message: "Data saved successfully!" });
      } else {
        res.status(200).json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.status(200).json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getLeadsDataAtCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isCaptain = req.id;

    if (isRestaurant) {
      if (isCaptain) {
        const LeadsDetails = await Leads.find({
          restaurant: isRestaurant,
          captainId: isCaptain,
        }).sort({ _id: -1 });
        return res.json({ success: true, LeadsDetails });
      } else {
        res.status(200).json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.status(200).json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteLeadDataAtCap = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const isCaptain = req.id;

    const { LeadId } = req.body;
    if (restaurant) {
      if (isCaptain) {
        const DeletedLead = await Leads.findOneAndDelete({
          _id: LeadId,
          restaurant: restaurant,
        });
        res.json({
          success: true,
          message: `${DeletedLead.customerName}'s data deleted!`,
        });
      } else {
        res.status(200).json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.status(200).json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getToEditLeadAtCap = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const isCaptain = req.id;
    const leadId = req.params.leadId;

    if (restaurant) {
      if (isCaptain) {
        const LeadsData = await Leads.findOne({
          _id: leadId,
          restaurant: restaurant,
          captainId: isCaptain,
        });
        if (LeadsData) {
          res.json({ success: true, LeadsData });
        } else {
          res.status(404).json({ success: false, message: "Menu not found" });
        }
      } else {
        res.status(200).json({
          success: false,
          message: "Your session expired, Please login!",
        });
      }
    } else {
      res.json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateLeadsAtCap = async (req, res) => {
  try {
    const leadId = req.params.leadId;
    const { customerName, phone, email, maritalStatus, dob, anniversaryDate } =
      req.body;

    const updatedLeadData = await Leads.findOneAndUpdate(
      { _id: leadId },
      {
        $set: {
          customerName,
          phone,
          email,
          maritalStatus,
          dob,
          anniversaryDate,
        },
      },
      { new: true }
    );

    if (!updatedLeadData) {
      return res
        .status(404)
        .json({ success: false, message: "lead data not found" });
    }

    res.json({
      success: true,
      message: `${customerName}'s data updated!`,
      category: updatedLeadData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
