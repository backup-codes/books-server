const { generateBillId } = require("../middleware/bill_ID");
const AccessedEmployees = require("../model/access_model");
const Menu = require("../model/menu_model");
const Order = require("../model/order_model");
const MenuCategory = require("../model/menuCategory_model");
const PosTodayExpense = require("../model/posTodayExpense");
const PosTodayClosing = require("../model/posTodayClosing");
const PosCustomerbill = require("../model/customer_bill_model");
const Customers = require("../model/customer_model");
const Leads = require("../model/leads_model");
const jwtToken = require("jsonwebtoken");
const Restaurant = require("../model/restaurant_model");
const PosTodayOpeningBalance = require("../model/posTodayOpeningBalance");
const { S3uploadFile } = require("./access_controller");
const helpers = require("../utils/helpers");
const mongoose = require("mongoose");
const posTodayClosing = require("../model/posTodayClosing");
const swiggy_menu_item_model = require("../model/swiggy_menu_item_model");
const others_menu_item_model = require("../model/others_menu_item_model");
const zomato_menu_Items_model = require("../model/zomato_menu_Items_model");
const bromag_menu_items = require("../model/bromag_menu_items");
const menuCategory_model = require("../model/menuCategory_model");
const restaurant_menu_model = require("../model/restaurant_menu_model");
// import posTodayClosing from "../model/posTodayClosing";
// import posTodayExpense from "../model/posTodayExpense";
// import PosTodayOpeningBalanceModel from "../model/posTodayOpeningBalance";

function generateRandomNumber() {
  return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
}

exports.getAllOpeningDateFilter = async (req, res) => {
  
  try {
    
    const restro = req.restaurant;
    const POSID = req.id;
    const { date } = req.query
    console.log(date," i am date");
    if (date) {
      const { start, end } = date
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      response = await PosTodayOpeningBalance.find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        restaurant: restro,
        posId: POSID

      }).sort({ date: -1 });

      return res.status(200).json({success:true,message:"SuccessFully Fetched",FilteredData:response})

    } else {
    
      return res.status(200).json({success:false,message:"Invalid Date"})
    }

  } catch (err) {
    console.log(err);
    return res.status(500).json({success:false,message:"Internal Server Error"})
   }
}


exports.isPassBookReportsAdded = async (req, res) => {
  try {
    const restroID = req.restaurant
    const posID = req.id

    
    const restaurantId = new mongoose.Types.ObjectId(restroID);
const posId = new mongoose.Types.ObjectId(posID);
const today = new Date(); // This gets the current date and time

// Set the time to midnight for today's date to search for documents created today
today.setHours(0, 0, 0, 0);

// Define the query
const query = {
  restaurant: restaurantId,
  posId: posId,
  date: {
    $gte: today, // Greater than or equal to midnight today
    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than midnight tomorrow
  },
    };
    
    const ClosingResponse = await PosTodayClosing.findOne(query)
    
    const isClosingExist = ClosingResponse ? true : false;
    
    const OpeningResponse = await PosTodayOpeningBalance.findOne(query)


    const isOpeningExist = OpeningResponse ? true : false;


    
    res.status(200).json({success:true,message:"Successfully Verified",isClosingExist,isOpeningExist})

  } catch (err) {
    console.log(err);
   return res.status(500).json({ success: false, message: "Something went wrong" });
    
  }
}

exports.getUniqueBromagId = async (req, res) => {
  try {
   
    const prefix = 'BIPL100323';
    let isUnique = false;
    let randomOrderId;
  
    while (!isUnique) {
      randomOrderId = `${prefix}${generateRandomNumber()}`;
      const existingOrder = await Order.findOne({ orderId: randomOrderId });
  
      if (!existingOrder) {
        isUnique = true;
      }
    }
  
   
  return res.status(200).json({success:true,message:"UniqueOrderId Created",OrderId:randomOrderId})

  } catch (err) {
    console.log(err);
   return res.status(500).json({ success: false, message: "Something went wrong" });
  }

}

exports.posDashboard = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    if (isRestaurant) {
      if (isPosManager) {
        const managerData = await AccessedEmployees.findOne({
          _id: req.id,
          accessFor: "POS manager",
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

exports.addTodaysExpense = async (req, res) => {
  try {
    const { amount, date, description } = req.body;

    const restaurant = req.restaurant;
    const Id = req.id;
    const file = req.file;
    if (file) {
      const imagePath = `passbook/${restaurant}/${file.filename}`;

      await helpers.uploadFile(file, imagePath);

      const imageURL = helpers.getS3FileUrl(imagePath);
      helpers.deleteFile(file.path);

      const TodaysExpenseData = {
        date: new Date(date),
        amount: amount,
        description: description,
        billURL: imageURL,
        restaurant: restaurant,
        posId: Id,
      };

      const posTodayExpense = new PosTodayExpense(TodaysExpenseData);

      await posTodayExpense.save();

      res
        .status(200)
        .json({ success: true, message: "Expense report added Successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

exports.addCustomerBill = async (req, res) => {
  try {
    const { amount, date, name, phone } = req.body;
    // const token = req.headers["authorization"];
    // const Token = token.replace(/"/g, "");
    // const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    const restaurant = req.restaurant;
    const posId = req.id;
    const file = req.file;
    if (req.file) {
      const customerdata = await Customers.findOne({
        customer: name,
        phone: phone,
      });

      if (customerdata) {
        const imagePath = `passbook/customerBill/${restaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        helpers.deleteFile(file.path);

        const imageURL = helpers.getS3FileUrl(imagePath);

        if (amount <= customerdata.limit) {
          const balance = customerdata.limit - amount;

          const BillData = {
            customer: customerdata._id,
            amount: amount,
            date: new Date(date),
            BillImage: imageURL,
            balance: balance,
            limit: customerdata.limit,
            restaurant: restaurant,
            employe: posId,
          };

          const Bill = new PosCustomerbill(BillData);

          await Bill.save();

          await Customers.updateOne(
            { _id: customerdata._id },
            { $set: { limit: balance } }
          );

          return res.status(200).json({
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

exports.addTodayClosing = async (req, res) => {
  try {
    // const {
    //   Totalorder,
    //   totalAmount,
    //   totalamountonlineorder,
    //   totalamounttakeaway,
    //   totalamountdinein,
    //   cashDenomination,
    //   date,
    // } = req.body;
    const { date, totalorder, totalAmount, totalAmountBromagOrders, totalAmountOthersOrder, totalAmountSwiggyOrder, totalAmountZomatoOrder, totalamounttakeaway, totalorderupi, cashDenomination } = req.body;

console.log(req.body);
console.log(req.files,"files")
    const cashDenominationArray = JSON.parse(cashDenomination);

    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    const restaurant = req.restaurant;
    const id = req.id;
    if (req.files) {
      const billImages = [];

      // Loop through each uploaded file
      for (const file of req.files) {


        const imagePath = `passbook/closingReport/${restaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        helpers.deleteFile(file.path);

        const imageURL = helpers.getS3FileUrl(imagePath);

        // Store the URL in the array
        billImages.push(imageURL);
      }

      const TodaysClosingData = {
        date: new Date(date),
        totalOrder: totalorder,
        totalAmount: totalAmount,
        posId: id,
        bill: billImages,
        totalAmountSwiggyOrder:totalAmountSwiggyOrder,
          totalAmountZomatoOrder:totalAmountZomatoOrder,
        totalAmountBromagOrder:totalAmountBromagOrders,
          totalAmountOthersOrder:totalAmountOthersOrder,
        totalAmountTakeaway: totalamounttakeaway,
        cashDenomination: cashDenominationArray,
        totalOrderUPI:totalorderupi,
        restaurant: validUser.restaurant,
      };
      const TodayClosing = new PosTodayClosing(TodaysClosingData);

      await TodayClosing.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Closing Data added successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "something went wrong" });
  }
};

exports.addOpeningbalance = async (req, res) => {
  try {
    const id = req.id;
    const { date, totalAmount, cashDenomination } = req.body;
    const transformedCashDenomination = cashDenomination.map((item) => ({
      label: item.label,
      count: item.count,
    }));
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    const openingBalanceData = {
      date: new Date(date),
      totalAmount,
      cashDenomination: transformedCashDenomination,
      restaurant: validUser.restaurant,
      posId: id,
    };

    const newOpeningBalance = new PosTodayOpeningBalance(openingBalanceData);

    await newOpeningBalance.save();

    res
      .status(200)
      .json({ success: true, message: "Opening balance added successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "something went wrong" });
  }
};

exports.getMenuDataAtPos = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const managerData = await AccessedEmployees.findOne({
        _id: req.id,
        accessFor: "POS manager",
        restaurant: isRestaurant,
      });


      if (managerData) {
        const { platform } = req.query
        

        let menuData 

        if (platform === 'takeaway') {
  
          menuData = await restaurant_menu_model.find({
            isShared: true,
            publish: true,
            menuShared: true,
            restaurant:isRestaurant,
            quantity: { $gt: 0 }
          })
          


}


        if (platform === "Swiggy") {

          menuData = await swiggy_menu_item_model.find({
            isShared: true,
            publish: true,
            menuShared: true,
            restaurant:isRestaurant,
            quantity: { $gt: 0 }
          })

        }

        if (platform === "Others") {
          menuData = await others_menu_item_model.find({
            isShared: true,
            publish: true,
            menuShared: true,
            restaurant:isRestaurant,

            quantity: { $gt: 0 }
          })
        }

        if (platform === "Zomato") {
          menuData = await zomato_menu_Items_model.find({
            isShared: true,
            publish: true,
            menuShared: true,
            restaurant:isRestaurant,
            quantity: { $gt: 0 }
          })

        }
        if (platform === "Bromag") {
          menuData = await bromag_menu_items.find({
            isShared: true,
            publish: true,
            restaurant:isRestaurant,
            menuShared: true,
            quantity: { $gt: 0 }
          })
        }

       const  CategoryData = await menuCategory_model.find({restaurant:isRestaurant})

      

      return  res.status(200).json({ success: true, MenuData: menuData,CategoryData });
      
      } else {
        res
          .status(200)
          .json({ success: false, message: "Pos session expired" });
      }
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
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



exports.KotOrders = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    const IsExistingOrder = req.body.HoldMenu;
    const orderId = IsExistingOrder._id;
    const Amount = req.body.TotalPrice;
    const Items = req.body.kotData;
    let KotItemsArray = []
    



    console.log(KotItemsArray, "KotItems");


    const billId = generateBillId();

    if (isRestaurant) {

      if (isPosManager) {

      Items.map((item,i) => {
        const Price = item.discountPrice ? item.discountPrice : item.actualPrice
        
      let Kotitems = {
          id: item._id,
          quantity:item.orderedQuantity ,
          item:item.item ,
          price: Price,
          totalItemPrice: Price * item.orderedQuantity,
        }
   KotItemsArray.push(Kotitems)
      })



        if (IsExistingOrder) {
     
          const updatedOrder = await Order.findOneAndUpdate(
            {
              _id: orderId,
              orderMode: { $ne: "online" },
            },
            {
        
              $set: { orderMode: "takeaway" },
            },
            { new: true }
          );





          for (const Kotitems of KotItemsArray) {
            
            const kotItemIndex = updatedOrder.KotItems.findIndex(
              (item) => item.id === Kotitems.id
            );
          
            if (kotItemIndex !== -1) {
              
              updatedOrder.KotItems[kotItemIndex].quantity += Kotitems.quantity;
              updatedOrder.KotItems[kotItemIndex].totalItemPrice +=
                Kotitems.totalItemPrice;
            } else {
             
              updatedOrder.KotItems.push(Kotitems);
            }
          }
          
          
          await updatedOrder.save();
          
console.log(updatedOrder,"i am updated order");
          if (updatedOrder && updatedOrder.KotItems) {
            console.log("geyyyy");
            const totalAmount = updatedOrder.KotItems.reduce(
              (accumulator, item) => accumulator + item.totalItemPrice,
              0
            );

            console.log(totalAmount,"i am total");
            await Order.updateOne({ _id: orderId }, { Amount: totalAmount });

            KotItemsArray.map((item, index) => {
              
              console.log(item.item, index);
              
             decrementMenuItemQuantity('Bromag', isRestaurant, item.item, item.quantity);
              decrementMenuItemQuantity('Swiggy', isRestaurant, item.item, item.quantity);
              decrementMenuItemQuantity('Zomato', isRestaurant, item.item, item.quantity);
              decrementMenuItemQuantity('OthersMenu', isRestaurant, item.item, item.quantity);
              decrementMenuItemQuantity('restaurantMenu', isRestaurant, item.item, item.quantity);
              
            })



            return res.status(200).json({
              success: true,
              message: "Kitchen to order recorded!",
              orderId:orderId
            });
          } else {
            return res.status(404).json({
              success: false,
              message: "Order not found or orderMode is online.",
            });
          }
        }
      }

    
      if (req.body.orderData) {
        const {
          orderStation,
          orderId,
          orderTime,
          paymentMethod,
          orderMode,
          customerName,
          phone,
        } = req.body.orderData;
        console.log(req.body.orderData,"i am orderdata");

        if (orderMode === "Zomato" || orderMode === "Swiggy" || orderMode === "Bromag" || orderMode === "others") {
          // Save new online order
          const order = new Order({
            orderStation,
            orderId,
            billId: billId,
            orderTime,
            paymentMethod,
            Amount,
            orderMode: orderMode,
            KotItems: KotItemsArray,
            restaurantId: isRestaurant,
            posManagerId: req.id,
          });
          await order.save();


          console.log(KotItemsArray,"KotItemsArray");
          KotItemsArray.map((item,index) => {
                         decrementMenuItemQuantity('Bromag', isRestaurant, item.item, item.quantity);
                          decrementMenuItemQuantity('Swiggy', isRestaurant, item.item, item.quantity);
                          decrementMenuItemQuantity('Zomato', isRestaurant, item.item, item.quantity);
                          decrementMenuItemQuantity('OthersMenu', isRestaurant, item.item, item.quantity);
                          decrementMenuItemQuantity('restaurantMenu', isRestaurant, item.item, item.quantity);
                          
                        })

          return res.status(200).json({
            success: true,
            message: `${orderMode} Order recorded!`,
          });
        } else {
          // Save new dine-in order
          const order = new Order({
            customerName,
            phone,
            orderMode: orderMode,
            Kotitems:KotItemsArray,
            paymentMethod,
            restaurantId: isRestaurant,
            posManagerId: req.id,
          });
          const savedOrder = await order.save();

          console.log(KotItemsArray,"Kot at takewayy");

          KotItemsArray.map((item,index) => {
            decrementMenuItemQuantity('Bromag', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('Swiggy', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('Zomato', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('OthersMenu', isRestaurant, item.item, item.quantity);
             decrementMenuItemQuantity('restaurantMenu', isRestaurant, item.item, item.quantity);
             
           })


          const Order_Id = savedOrder._id.toString();

          return res.status(200).json({
            success: true,
            message: "Kitchen to order recorded!",
            orderId: Order_Id,
          });



        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Missing order data in the request body.",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAllcustomerBill = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const BillData = await PosCustomerbill.find({
        restaurant: validUser.restaurant,
      }).populate("customer").sort({ date: -1 });
      res.status(200).json({ success: true, BillData: BillData });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.updateProfileImagePos = async (req, res) => {
  try {
    const file = req.files[0];
    const id = req.id;
    const restaurantId = req.restaurant;

    if (file && id && restaurantId) {
      const existingUser = await AccessedEmployees.findOne({ _id: id });

      const { profileImage } = existingUser;
      await helpers.deleteS3File(profileImage);

      const imagePath = `passbook/${restaurantId}/${file.filename}`;

      await helpers.uploadFile(file, imagePath);

      helpers.deleteFile(file.path);

      const imageURL = helpers.getS3FileUrl(imagePath);

      await AccessedEmployees.updateOne(
        { _id: id },
        { $set: { profileImage: imageURL } }
      );

      res.status(200).json({
        success: true,
        message: " Update Succesful",
        profileImage: imageURL,
      });
    } else {
      res
        .status(200)
        .json({ success: false, message: "Failed to update Image" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Somehing went wrong" });
    console.log(err);
  }
};

exports.searchTodayClosing = async (req, res) => {
  try {
    console.log("called");
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const searchValue = req.params.query;
      const query = {};

      if (searchValue) {
        if (!isNaN(searchValue)) {
          // If searchValue is a valid number, use direct equality match
          console.log("case 1");
          query.totalAmount = searchValue;
        } else {
          console.log("case 2");
          // If searchValue is not a valid number, use $regex for case-insensitive search
          query.totalAmount = { $regex: searchValue, $options: "i" };
        }
      }

      query.posId = validUser.id;

      console.log("Query:", query);

      const result = await PosTodayClosing.find(query);

      console.log("Result:", result);
     return  res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    console.log(error);
  }
};
exports.searchTodayOpening = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const searchValue = req.params.query;
      const query = {};

      if (searchValue) {
        query.$or = [
          // { description: { $regex: searchValue, $options: "i" } },
          // { amount: { $regex: searchValue, $options: "i" } },
          { totalAmount: { $regex: searchValue, $options: "i" } },

        ];
      }

      query.posId = validUser.id;
      const result = await PosTodayOpeningBalance.find(query);

     return  res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    console.log(error);
  }
};
exports.searchTodaysExpense = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const searchValue = req.params.query;
      const query = {};

      if (searchValue) {
        query.$or = [
          { description: { $regex: searchValue, $options: "i" } },
          { amount: { $regex: searchValue, $options: "i" } },
          { billURL: { $regex: searchValue, $options: "i" } },

        ];
      }
      query.posId = validUser.id;
      const result = await PosTodayExpense.find(query);

      res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.printBill = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    console.log(req.body, "body data");
    const userId = req.body.userId;
    // const { orderMode } = req.body.orderData;

    const Amount = req.body.amount;
    // const KotItems = req.body.kotData;
    // const kotId = req.body.kotId;

    const billId = generateBillId();
    if (isRestaurant) {
      if (isPosManager) {
        // if (orderMode == "takeaway") {
        //   if (!kotId) {
        //     return res.status(400).json({
        //       success: false,
        //       message: "Check your network connection",
        //     });
        //   }
        const order = await Order.updateOne(
          { _id: userId },
          {
            billId: billId,
            Amount: Amount,
            orderStatus:"Success"

          }
        );
        res.json({ success: true, message: "Order updated successfully!" });
        // }
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

exports.todayExpense = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    const expenseData = req.body;

    if (isRestaurant) {
      if (isPosManager) {
        const expense = new PosTodayExpense({
          date: expenseData.date,
          totalOrder: expenseData.totalOrder,
          totalAmount: expenseData.totalAmount,
          totalOnlineRs: expenseData.totalOnlineRs,
          totalTakeAwayRs: expenseData.totalTakeAwayRs,
          totalDineInRs: expenseData.totalDineInRs,
          cashReceived: {
            note2000: expenseData.notes ? expenseData.notes * 2000 : 0,
            note500: expenseData.note500 ? expenseData.note500 * 500 : 0,
            note200: expenseData.notes200 ? expenseData.notes200 * 200 : 0,
            note100: expenseData.notes100 ? expenseData.notes100 * 100 : 0,
            note50: expenseData.notes50 ? expenseData.notes50 * 50 : 0,
            note20: expenseData.notes20 ? expenseData.notes20 * 20 : 0,
            note10: expenseData.notes10 ? expenseData.notes10 * 10 : 0,
            coins: expenseData.coinAmount ? expenseData.coinAmount : 0,
          },
          upiPayments: {
            totalOrders: expenseData.upiTotalOrders,
            totalAmount: expenseData.upiTotalAmount,
          },
          restaurant: isRestaurant,
        });
        await expense.save();

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

exports.posExpenseData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const pos = req.id;
      if (pos) {
        const DayExpense = await PosTodayExpense.find({
          restaurant: isRestaurant,
        });

        const totalAmountAggregate = await PosTodayExpense.aggregate([
          {
            $group: {
              _id: { restaurant: "$restaurant" },
              totalAmount: { $sum: "$totalAmount" },
            },
          },
        ]);

        const totalAmountValue = totalAmountAggregate[0]?.totalAmount || 0;

        res.status(200).json({
          success: true,
          DayExpense: DayExpense,
          Total: totalAmountValue,
        });
      } else {
        res
          .status(200)
          .json({ success: false, message: "Pos session expired" });
      }
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.passbookDateFilter = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (restaurant) {
      if (req.id) {
        const { start, end } = req.body;

        console.log(start, end);

        const filteredData = await PosTodayClosing.find({
          date: { $gte: start, $lte: end },
          restaurant: restaurant,
        });

        return res.json({ success: true, data: filteredData });
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
exports.TodaysClosingDateFilter = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (restaurant) {
      if (req.id) {
        const { start, end } = req.body;

        const filteredData = await PosTodayClosing.find({
          date: { $gte: start, $lte: end },
          restaurant: restaurant,
        });

        return res.json({ success: true, data: filteredData });
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
exports.expenseDateFilter = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (restaurant) {
      if (req.id) {
        const { start, end } = req.body;

        const filteredData = await PosTodayExpense.find({
          date: { $gte: start, $lte: end },
          posId:req.id,
          restaurant: restaurant,
        });

        return res.json({ success: true, data: filteredData });
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

const getTodaysClosingBalanceAdmin = async (restaurantId, currentDate, nextDay) => {
  try {
    return await PosTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
        },
      },
      {
        $group: {
          _id: "ClosingAmount",
          totalAmountSum: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.log(err);
  }
};
const getTodaysClosingBalanceAdminOfSpecificPO = async (restaurantId, currentDate, nextDay,POSId) => {
  try {
    return await PosTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
          posId: new mongoose.Types.ObjectId(POSId),
        },
      },
      {
        $group: {
          _id: "ClosingAmount",
          totalAmountSum: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.log(err);
  }
};


const getTodaysOpeningBalanceAdmin = async (
  restaurantId,
  currentDate,
  nextDay
) => {
  try {
    return await PosTodayOpeningBalance.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
        },
      },
      {
        $group: {
          _id: "OpeningAmount",
          totalAmountSum: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.log(err);
  }
};
const getTodaysOpeningBalanceAdminSpecificPOS = async (
  restaurantId,
  currentDate,
  nextDay,
  PosId
) => {
  try {
    return await PosTodayOpeningBalance.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
          posId: new mongoose.Types.ObjectId(PosId)
        },
      },
      {
        $group: {
          _id: "OpeningAmount",
          totalAmountSum: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.log(err);
  }
};

const getTodaysClosingAmount = async (restaurantId, currentDate, nextDay) => {
  try {
    return await posTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
        },
      },
      {
        $group: {
          _id: "ClosingAmount",
          todaysClosingAmount: { $sum: "$totalAmount" },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getTodaysTotalExpense = async (restaurantId, currentDate, nextDay) => {
  try {
    return await PosTodayExpense.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
        },
      },
      {
        $group: {
          _id: "FloatingAmount",
          totalExpenseSum: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};
const getTodaysTotalExpenseOfSpecificPOS = async (restaurantId, currentDate, nextDay,PosId) => {
  try {
    return await PosTodayExpense.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: currentDate, $lt: nextDay },
          posId: new mongoose.Types.ObjectId(PosId)
        },
      },
      {
        $group: {
          _id: "FloatingAmount",
          totalExpenseSum: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getYestardaysTotalExpense = async (
  restaurantId,
  currentDate,
  yesterday
) => {
  try {
    return await PosTodayExpense.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: yesterday, $lt: currentDate },
        },
      },
      {
        $group: {
          _id: "Total Expense",
          yesterdayTotalExpenseSum: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getYesterdayssOpeningBalance = async (
  restaurantId,
  currentDate,
  yesterday
) => {
  try {
    return await PosTodayOpeningBalance.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: yesterday, $lt: currentDate },
        },
      },
      {
        $group: {
          _id: "Total Opening",
          yesterdayTotalOpening: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastCompleteWeekTotalClosingBalance = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the start of the last complete week (Sunday)
    const lastSunday = new Date(currentDate);
    lastSunday.setDate(
      currentDate.getDate() - ((currentDate.getDay() + 6) % 7)
    );

    // Calculate the start of last week (Monday)
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);

    return await PosTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: lastMonday, $lt: lastSunday },
        },
      },
      {
        $group: {
          _id: null,
          lastWeekTotalAmountSum: { $sum: "$totalAmount" },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastCompleteWeekTotalOpeningBalance = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the start of the last complete week (Sunday)
    const lastSunday = new Date(currentDate);
    lastSunday.setDate(
      currentDate.getDate() - ((currentDate.getDay() + 6) % 7)
    );

    // Calculate the start of last week (Monday)
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);

    return await PosTodayOpeningBalance.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: lastMonday, $lt: lastSunday },
        },
      },
      {
        $group: {
          _id: null,
          lastWeekTotalAmountSum: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastCompleteWeekTotalExpense = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the start of the last complete week (Sunday)
    const lastSunday = new Date(currentDate);
    lastSunday.setDate(
      currentDate.getDate() - ((currentDate.getDay() + 6) % 7)
    );

    // Calculate the start of last week (Monday)
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);

    return await PosTodayExpense.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: lastMonday, $lt: lastSunday },
        },
      },
      {
        $group: {
          _id: null,
          lastWeekTotalExpenseSum: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastMonthTotalExpense = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current month
    const firstDayOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Calculate the first day of the last month
    const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    firstDayOfLastMonth.setMonth(firstDayOfCurrentMonth.getMonth() - 1);

    // Calculate the last day of the last month
    const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfLastMonth.setDate(firstDayOfCurrentMonth.getDate() - 1);

    return await PosTodayExpense.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          lastMonthTotalExpenseSum: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastMonthTotalOpeningBalance = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current month
    const firstDayOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Calculate the first day of the last month
    const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    firstDayOfLastMonth.setMonth(firstDayOfCurrentMonth.getMonth() - 1);

    // Calculate the last day of the last month
    const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfLastMonth.setDate(firstDayOfCurrentMonth.getDate() - 1);

    return await PosTodayOpeningBalance.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          lastMonthTotalOpeningBalance: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastMonthTotalClosingBalance = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current month
    const firstDayOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Calculate the first day of the last month
    const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    firstDayOfLastMonth.setMonth(firstDayOfCurrentMonth.getMonth() - 1);

    // Calculate the last day of the last month
    const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfLastMonth.setDate(firstDayOfCurrentMonth.getDate() - 1);

    return await PosTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          lastMonthTotalClosingBalance: { $sum: "$totalAmount" },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};


const getLastYearTotalExpense = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current year
    const firstDayOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);

    // Calculate the first day of the last year
    const firstDayOfLastYear = new Date(firstDayOfCurrentYear);
    firstDayOfLastYear.setFullYear(firstDayOfCurrentYear.getFullYear() - 1);

    // Calculate the last day of the last year
    const lastDayOfLastYear = new Date(firstDayOfCurrentYear);
    lastDayOfLastYear.setDate(firstDayOfCurrentYear.getDate() - 1);

    return await PosTodayExpense.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: firstDayOfLastYear, $lte: lastDayOfLastYear },
        },
      },
      {
        $group: {
          _id: null,
          lastYearTotalExpense: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastYearTotalOpeningBalance = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current year
    const firstDayOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);

    // Calculate the first day of the last year
    const firstDayOfLastYear = new Date(firstDayOfCurrentYear);
    firstDayOfLastYear.setFullYear(firstDayOfCurrentYear.getFullYear() - 1);

    // Calculate the last day of the last year
    const lastDayOfLastYear = new Date(firstDayOfCurrentYear);
    lastDayOfLastYear.setDate(firstDayOfCurrentYear.getDate() - 1);

    return await PosTodayOpeningBalance.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: firstDayOfLastYear, $lte: lastDayOfLastYear },
        },
      },
      {
        $group: {
          _id: null,
          lastYearTotalOpeningBalance: { $sum: { $toDouble: "$totalAmount" } },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

const getLastYearTotalClosingBalance = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current year
    const firstDayOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);

    // Calculate the first day of the last year
    const firstDayOfLastYear = new Date(firstDayOfCurrentYear);
    firstDayOfLastYear.setFullYear(firstDayOfCurrentYear.getFullYear() - 1);

    // Calculate the last day of the last year
    const lastDayOfLastYear = new Date(firstDayOfCurrentYear);
    lastDayOfLastYear.setDate(firstDayOfCurrentYear.getDate() - 1);

    return await PosTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: firstDayOfLastYear, $lte: lastDayOfLastYear },
        },
      },
      {
        $group: {
          _id: null,
          lastYearTotalClosingBalance: { $sum: "$totalAmount" },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};


const gettodaysSalesAmountSum = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const orderAmountSum = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          billId: { $exists: true },
          date: {
            $gte: currentDate,
            $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
          },
          orderMode: { $ne: "dineIn" },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (orderAmountSum.length > 0) {
      return orderAmountSum[0].totalAmount;
    } else {
      return 0;
    }
  } catch (err) {
    console.error(err);
  }
};
const gettodaysSalesAmountSumOfSpecificPOS = async (restaurantId,PosId) => {
  try {

    console.log(PosId,"PosId");
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const orderAmountSum = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          billId: { $exists: true },
          date: {
            $gte: currentDate,
            $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),

          },
          posManagerId: PosId
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (orderAmountSum.length > 0) {
      return orderAmountSum[0].totalAmount;
    } else {
      return 0;
    }

  } catch (err) {
    console.error(err);
  }
};

const getOrderAmountSumLastMonth = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current month
    const firstDayOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Calculate the first day of the last month
    const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth);
    firstDayOfLastMonth.setMonth(firstDayOfCurrentMonth.getMonth() - 1);

    const orderAmountSum = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          billId: { $exists: true },
          date: { $gte: firstDayOfLastMonth, $lt: firstDayOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (orderAmountSum.length > 0) {
      return orderAmountSum[0].totalAmount;
    } else {
      return 0; // No orders found for the specified conditions
    }
  } catch (err) {
    console.error(err);
  }
};

const getOrderAmountSumLastYear = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the first day of the current year
    const firstDayOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);

    // Calculate the first day of the last year
    const firstDayOfLastYear = new Date(firstDayOfCurrentYear);
    firstDayOfLastYear.setFullYear(firstDayOfCurrentYear.getFullYear() - 1);

    const orderAmountSum = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          billId: { $exists: true },
          date: { $gte: firstDayOfLastYear, $lt: firstDayOfCurrentYear },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (orderAmountSum.length > 0) {
      return orderAmountSum[0].totalAmount;
    } else {
      return 0; // No orders found for the specified conditions
    }
  } catch (err) {
    console.error(err);
  }
};
const getOrderAmountSumLastWeek = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const currentDayOfWeek = currentDate.getDay();

    // Calculate the first day of the last week (last Monday)
    const firstDayOfLastWeek = new Date(currentDate);
    firstDayOfLastWeek.setDate(currentDate.getDate() - currentDayOfWeek - 6);

    // Calculate the last day of the last week (last Saturday)
    const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
    lastDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() + 5);

    const orderAmountSum = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          billId: { $exists: true },
          date: { $gte: firstDayOfLastWeek, $lte: lastDayOfLastWeek },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (orderAmountSum.length > 0) {
      return orderAmountSum[0].totalAmount;
    } else {
      return 0; // No orders found for the specified conditions
    }
  } catch (err) {
    console.error(err);
  }
};


const getClosingAmountSumYesterday = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the date of yesterday
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    const closingAmountSum = await PosTodayClosing.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          date: { $gte: yesterday, $lt: currentDate },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    if (closingAmountSum.length > 0) {
      return closingAmountSum[0].totalAmount;
    } else {
      return 0; // No closing records found for the specified conditions
    }
  } catch (err) {
    console.error(err);
  }
};


const getOrderAmountSumYesterday = async (restaurantId) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to midnight

    // Calculate the date of yesterday
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    const orderAmountSum = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          billId: { $exists: true },
          date: { $gte: yesterday, $lt: currentDate },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (orderAmountSum.length > 0) {
      return orderAmountSum[0].totalAmount;
    } else {
      return 0; // No orders found for the specified conditions
    }
  } catch (err) {
    console.error(err);
  }
};

exports. TodaysAdminPassbookData = async (req, res) => {
  try {
    const restaurantId = req.restaurant;
    const params = req.query;
    
    

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    let TodaysData
    if (params.posManager === 'All') {
      
    //Today
    const todaysOpeningBalance = await getTodaysOpeningBalanceAdmin(
      restaurantId,
      currentDate,
      nextDay
    );
    const todaysTotalExpense = await getTodaysTotalExpense(
      restaurantId,
      currentDate,
      nextDay
    );
    const todaysFloatingCash = await gettodaysSalesAmountSum(
      restaurantId
    )
  
    const todaysClosingBalance = await getTodaysClosingBalanceAdmin(
      restaurantId,
      currentDate,
      nextDay
    )

      TodaysData = [{
      title: "Opening Amount",
      amount:todaysOpeningBalance.length>0?todaysOpeningBalance[0].totalAmountSum:0
    },
    {
      title: "Floating Amount",
      amount:todaysFloatingCash
    },
    {
      title: "Expense Amount",
      amount:todaysTotalExpense.length>0?todaysTotalExpense[0].totalExpenseSum:0
    },
    {
      title: "Closing  Amount",
      amount:todaysClosingBalance.length>0?todaysClosingBalance[0].totalAmountSum:0
    },
    {
      title: "Total Sales",
      amount: (
        ((todaysOpeningBalance.length > 0 ? todaysOpeningBalance[0].totalAmountSum : 0) || 0) +
        (todaysFloatingCash || 0) -
        ((todaysTotalExpense.length > 0 ? todaysTotalExpense[0].totalExpenseSum : 0) || 0)
      )
    },
    ]

    return res.status(200).json({
      success: true,
      message:"SuccessFully Fetched",
      TodaysData,
      
    });
    } else {
      
      const todaysOpeningBalance = await getTodaysOpeningBalanceAdminSpecificPOS(
        restaurantId,
        currentDate,
        nextDay,
        params.posManager
      );
      const todaysTotalExpense = await getTodaysTotalExpenseOfSpecificPOS(
        restaurantId,
        currentDate,
        nextDay,
        params.posManager

      );
      const todaysFloatingCash = await gettodaysSalesAmountSumOfSpecificPOS(
        restaurantId,   params.posManager
      )
    
      const todaysClosingBalance = await getTodaysClosingBalanceAdminOfSpecificPO(
        restaurantId,
        currentDate,
        nextDay,
        params.posManager
        
      )
  
      console.log(todaysFloatingCash,"todaysFloatingCash");

        TodaysData = [{
        title: "Opening Amount",
        amount:todaysOpeningBalance.length>0?todaysOpeningBalance[0].totalAmountSum:0
      },
      {
        title: "Floating Amount",
        amount:todaysFloatingCash
      },
      {
        title: "Expense Amount",
        amount:todaysTotalExpense.length>0?todaysTotalExpense[0].totalExpenseSum:0
      },
      {
        title: "Closing  Amount",
        amount:todaysClosingBalance.length>0?todaysClosingBalance[0].totalAmountSum:0
      },
      {
        title: "Total Sales",
        amount: (
          ((todaysOpeningBalance.length > 0 ? todaysOpeningBalance[0].totalAmountSum : 0) || 0) +
          (todaysFloatingCash || 0) -
          ((todaysTotalExpense.length > 0 ? todaysTotalExpense[0].totalExpenseSum : 0) || 0)
        )
      },
      ]
  
      return res.status(200).json({
        success: true,
        message:"SuccessFully Fetched",
        TodaysData,
        
      });

  }
    

  } catch (err) {
    console.log(err);
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}

exports.getPassBookData = async (req, res) => {
  try {
    const restaurantId = req.restaurant;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    //Today
    const todaysOpeningBalance = await getTodaysOpeningBalanceAdmin(
      restaurantId,
      currentDate,
      nextDay
    );
    const todaysTotalExpense = await getTodaysTotalExpense(
      restaurantId,
      currentDate,
      nextDay
    );
    const todaysFloatingCash = await gettodaysSalesAmountSum(
      restaurantId
    )
  
    const todaysClosingBalance = await getTodaysClosingBalanceAdmin(
      restaurantId,
      currentDate,
      nextDay
    )
    //Yesterday
    const YesterdaysTotalExpense = await getYestardaysTotalExpense(
      restaurantId,
      currentDate,
      yesterday
    );
    const YesterdaysTotalOpening = await getYesterdayssOpeningBalance(
      restaurantId,
      currentDate,
      yesterday
    );
    const yesterDaysFloatingCash = await getOrderAmountSumYesterday(
      restaurantId
    );


const YesterdaysTotalClosing= await getClosingAmountSumYesterday(restaurantId)

//Last-Week
    const LastWeekTotalOpening = await getLastCompleteWeekTotalOpeningBalance(
      restaurantId
    );
    const lastWeekTotalExpense = await getLastCompleteWeekTotalExpense(
      restaurantId
    );
    const lastWeekFloatingCash = await getOrderAmountSumLastWeek(restaurantId);


    const lastweekClosingBalance = await getLastCompleteWeekTotalClosingBalance(restaurantId)

//Last-Month
    const lastMonthTotalExpense = await getLastMonthTotalExpense(restaurantId);
    const lastMonthOpeningBalance = await getLastMonthTotalOpeningBalance(
      restaurantId
    );

    const lastMonthFloatingCash = await getOrderAmountSumLastMonth(restaurantId)

    const lastMonthClosingBalance = await getLastMonthTotalClosingBalance(restaurantId)

    //Last-Year
    const lastYearOpeningBalance = await getLastYearTotalOpeningBalance(
      restaurantId
    );
    // 
const lastYearExpense = await getLastYearTotalExpense(restaurantId);
    const lastYearFloatingcash = await getOrderAmountSumLastYear(restaurantId);

    // console.log(lastYearOpeningBalance, "lastYearOpeningBalance");
    // console.log(lastYearExpense, "lastYearExpense");
    // console.log(lastYearFloatingcash, "lastYearFloatingcash");


    const lastYearClosing = await getLastYearTotalClosingBalance(restaurantId)
    
    // const lastYearExpense = await getLastYearTotalExpense(
    //   restaurantId
    // );
    // const lastYearFloatingcash = await getOrderAmountSumLastYear(restaurantId) 


    
   const  TodaysData = [{
      title: "Opening Amount",
      amount:todaysOpeningBalance.length>0?todaysOpeningBalance[0].totalAmountSum:0
    },
    {
      title: "Floating Amount",
      amount:todaysFloatingCash
    },
    {
      title: "Expense Amount",
      amount:todaysTotalExpense.length>0?todaysTotalExpense[0].totalExpenseSum:0
    },
    {
      title: "Closing  Amount",
      amount:todaysClosingBalance.length>0?todaysClosingBalance[0].totalAmountSum:0
    },
    {
      title: "Total Sales",
      amount: (
        ((todaysOpeningBalance.length > 0 ? todaysOpeningBalance[0].totalAmountSum : 0) || 0) +
        (todaysFloatingCash || 0) -
        ((todaysTotalExpense.length > 0 ? todaysTotalExpense[0].totalExpenseSum : 0) || 0)
      )
    },
    ]

    const YesterdaysData = [{
      title: "Opening Amount",
      amount:YesterdaysTotalOpening.length>0?YesterdaysTotalOpening[0].yesterdayTotalOpening:0
    },
    {
      title: "Floating Amount",
      amount:yesterDaysFloatingCash
    },
    {
      title: "Expense Amount",
      amount:YesterdaysTotalExpense.length>0?YesterdaysTotalExpense[0].yesterdayTotalExpenseSum:0
    }, {
      title: "Closing  Amount",
      amount:YesterdaysTotalClosing.length>0?YesterdaysTotalClosing[0].totalAmount:0
    },
    {
      title: "Total Sales",
      amount: (
        ((YesterdaysTotalOpening.length > 0 ? YesterdaysTotalOpening[0].yesterdayTotalOpening : 0) || 0) +
        (yesterDaysFloatingCash || 0) -
        ((YesterdaysTotalExpense.length > 0 ? YesterdaysTotalExpense[0].yesterdayTotalExpenseSum : 0) || 0)
      )
      }]
    
    
 

    // const YesterdaysData = [
    //   {
    //     title: "Opening Balance",
    //     amount:
    //       YesterdaysTotalOpening.length > 0
    //         ? YesterdaysTotalOpening[0].yesterdayTotalOpening
    //         : 0,
    //   },
    //   {
    //     title: "Floating Balance",
    //     amount: yesterDaysFloatingCash,
    //   },
    //   {
    //     title: "Expense Cash",
    //     amount:
    //       YesterdaysTotalExpense.length > 0
    //         ? YesterdaysTotalExpense[0].yesterdayTotalExpenseSum
    //         : 0,
    //   },
    //   {
    //     title: "Total Sales",
    //     amount:
    //       ((YesterdaysTotalOpening.length > 0
    //         ? YesterdaysTotalOpening[0].yesterdayTotalOpening
    //         : 0) || 0) +
    //       (yesterDaysFloatingCash || 0) -
    //       ((YesterdaysTotalExpense.length > 0
    //         ? YesterdaysTotalExpense[0].yesterdayTotalExpenseSum
    //         : 0) || 0),
    //   },
    // ];

    const LastWeekData = [
      {
        title: "Opening Amount",
        amount:
          LastWeekTotalOpening.length > 0
            ? LastWeekTotalOpening[0].lastWeekTotalAmountSum
            : 0,
      },
      {
        title: "Floating Amount",
        amount: lastWeekFloatingCash,
      },
      {
        title: "Expense Amount",
        amount:
          lastWeekTotalExpense.length > 0
            ? lastWeekTotalExpense[0].lastWeekTotalExpenseSum
            : 0,
      },
      {
        title: "Closing Amount",
        amount:
        lastweekClosingBalance.length > 0
            ? lastweekClosingBalance[0].lastWeekTotalAmountSum
            : 0,
      },
      {
        title: "Total Sales",
        amount:
          ((LastWeekTotalOpening.length > 0
            ? LastWeekTotalOpening[0].lastWeekTotalAmountSum
            : 0) || 0) +
          (lastWeekFloatingCash || 0) -
          ((lastWeekTotalExpense.length > 0
            ? lastWeekTotalExpense[0].lastWeekTotalExpenseSum
            : 0) || 0),
      },
    ];

    const LastMonthData = [
      {
        title: "Opening Amount",
        amount:
          lastMonthOpeningBalance.length > 0
            ? lastMonthOpeningBalance[0].lastMonthTotalOpeningBalance
            : 0,
      },
      {
        title: "Floating Amount",
        amount: lastMonthFloatingCash,
      },
      {
        title: "Expense Amount",
        amount:
          lastMonthTotalExpense.length > 0
            ? lastMonthTotalExpense[0].lastMonthTotalExpenseSum
            : 0,

      },{
        title: "Closing  Amount",
        amount:lastMonthClosingBalance.length>0?lastMonthClosingBalance[0].lastMonthTotalClosingBalance:0
      },
      {
        title: "Total Sales",
        amount:
          ((lastMonthOpeningBalance.length > 0
            ? lastMonthOpeningBalance[0].lastMonthTotalOpeningBalance
            : 0) || 0) +
          (lastMonthFloatingCash || 0) -
          ((lastMonthTotalExpense.length > 0
            ? lastMonthTotalExpense[0].lastMonthTotalExpenseSum
            : 0) || 0),
      },
    ];

    const LastYearData = [
      {
        title: "Opening Amount",
        amount:
          lastYearOpeningBalance.length > 0
            ? lastYearOpeningBalance[0].lastYearTotalOpeningBalance
            : 0,
      },
      {
        title: "Floating Amount",
        amount: lastYearFloatingcash,
      },
      {
        title: "Expense Amount",
        amount:
          lastYearExpense.length > 0
            ? lastYearExpense[0].lastYearTotalExpense
            : 0,
      },{
        title: "Closing  Amount",
        amount:lastYearClosing.length>0?lastYearClosing[0].lastYearTotalClosingBalance:0
      },
      {
        title: "Total Sales",
        amount:
          ((lastYearOpeningBalance.length > 0
            ? lastYearOpeningBalance[0].lastYearTotalOpeningBalance
            : 0) || 0) +
          (lastYearFloatingcash || 0) -
          ((lastYearExpense.length > 0
            ? lastYearExpense[0].lastYearTotalExpense
            : 0) || 0),
      },
    ];

    console.log(LastYearData);

    return res.status(200).json({
      success: true,
      TodaysData,
      YesterdaysData,
      LastWeekData,
      LastMonthData,
      LastYearData,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

exports.getOpeningData = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    if (validUser) {
      const data = await PosTodayOpeningBalance.find({
        posId:validUser.id,
        restaurant: validUser.restaurant,
      }).sort({date:-1})
     return  res.status(200).json({ success: true, data });
    } else {
      res.status(200).json({ success: false, message: "something went wrong" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.getTodaysOpeningData = async (req, res) => {

  try {

    
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const id = req.id;
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    if (validUser) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for the start of the day

      const Openingdata = await PosTodayOpeningBalance.findOne({
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        posId: id,
        restaurant: validUser.restaurant,
      });

      const Closingdata = await posTodayClosing.findOne({
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        posId: id,
        restaurant: validUser.restaurant,
      });


      const endOfDay = new Date(today);
      endOfDay.setDate(today.getDate() + 1);

      const queryForExpense = {
        date: { $gte: today, $lt: endOfDay },
        posId: new mongoose.Types.ObjectId(id),
        restaurant: new mongoose.Types.ObjectId(validUser.restaurant),
      };

      const Expensedata = await PosTodayExpense.aggregate([
        { $match: queryForExpense },
        {
          $group: {
            _id: null,
            totalExpense: { $sum: { $toDouble: "$amount" } },
          },
        },
      ]);



      const query = {
        restaurantId: validUser.restaurant,
        posManagerId: id,
        date: { $gte: today, $lt: endOfDay },
        billId: { $exists: true, $ne: null },
      };

      const Floatingdata = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$Amount" },
          },
        },
      ]);

      const OpeningAmount = Openingdata && Openingdata.totalAmount ? Openingdata.totalAmount : 0;
      const ClosingAmount = Closingdata && Closingdata.totalAmount ? Closingdata.totalAmount : 0;
      const FloatingAmount = Floatingdata && Floatingdata[0] && Floatingdata[0].totalAmount ? Floatingdata[0].totalAmount : 0;
      const ExpenseAmount = Expensedata && Expensedata[0]&& Expensedata[0].totalExpense ? Expensedata[0].totalExpense : 0;
      console.log(ExpenseAmount,"i am expense");
      // Check for NaN before performing addition
      const TotalSales = !isNaN(OpeningAmount) && !isNaN(FloatingAmount) && !isNaN(ExpenseAmount)
        ? +OpeningAmount + +FloatingAmount - +ExpenseAmount
        : 0;
      

    return res.status(200).json({ success: true, OpeningAmount, ClosingAmount, FloatingAmount, ExpenseAmount,TotalSales });
      

    } else {
      res.status(200).json({ success: false, message: "something went wrong" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.getTodayClosingData = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    if (validUser) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for the start of the day

      const data = await PosTodayClosing.find({
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        restaurant: validUser.restaurant,
      });

      console.log(data, "heloo data");
      res.status(200).json({ success: true, data });
    } else {
      res.status(200).json({ success: false, message: "something went wrong" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

const getTodaysTotalAmount = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
    };
    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmount;


  } catch (err) {
    console.log(err);
  }
};


const getTodaysTotalOrder = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
    };
    return await Order.countDocuments(query);
  } catch (err) {
    console.log(err);
  }
};
// getTodaysTotalAmountOnlineOrders

const getTodaysTotalAmountSwiggyOrders = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      orderMode: "Swiggy",
    };

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountSwiggy: { $sum: "$Amount" },
        },
      },
    ]);

    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountSwiggy;

  } catch (err) {
    console.log(err);
  }
};
const getTodaysTotalAmountBromagOrders = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      orderMode: "Bromag",
    };

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountBromag: { $sum: "$Amount" },
        },
      },
    ]);

    
    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountBromag;

  } catch (err) {
    console.log(err);
  }
};
const getTodaysTotalAmountZomatoOrders = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      orderMode: "Zomato",
    };

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountZomato: { $sum: "$Amount" },
        },
      },
    ]);

    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountZomato;

  } catch (err) {
    console.log(err);
  }
};
const getTodaysTotalAmountOthersOrders = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      orderMode: "Others",
    };

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountOthers: { $sum: "$Amount" },
        },
      },
    ]);



    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountOthers;

  } catch (err) {
    console.log(err);
  }
};



const getTodaysTotalAmountTakeAway = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      orderMode: "takeaway",
    };

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountTakeaway: { $sum: "$Amount" },
        },
      },
    ]);

    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountTakeaway;

  } catch (err) {
    console.log(err);
  }
};
const getTodaysTotalAmountDineIn = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      orderMode: "dineIn",
    };

    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountDineIn: { $sum: "$Amount" },
        },
      },
    ]);

    
    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountDineIn;

  } catch (err) {
    console.log(err);
  }
};

const getTodaysTotalOrderdsInUPI = async (restaurant, posid) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setDate(today.getDate() + 1);

    const query = {
      restaurantId: restaurant,
      posManagerId: posid,
      date: { $gte: today, $lt: endOfDay },
      billId: { $exists: true, $ne: null },
      paymentMethod: "UPI",
    };

    // Use the aggregate framework to calculate the sum of Amount
    const result = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmountUPI: { $sum: "$Amount" },
        },
      },
    ]);

     
    if (result.length === 0) {
      return 0;
    }

    // Extract and return only the totalAmount value
    return result[0].totalAmountUPI;


  } catch (err) {
    console.log(err);
  }
};

exports.GetClosingFieldData = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const posid = req.id;

    // Count the number of orders matching the query

    const todaysTotalOrders = await getTodaysTotalOrder(restaurant, posid);

    // [ { _id: null, totalAmount: 350 } ]
    const todaysTotalAmount = await getTodaysTotalAmount(restaurant, posid);


    const todaysTotalAmountSwiggyOrders = await getTodaysTotalAmountSwiggyOrders(restaurant, posid);
    const todaysTotalAmountZomatoOrders = await getTodaysTotalAmountZomatoOrders(restaurant, posid);
    const todaysTotalAmountOthersOrders = await getTodaysTotalAmountOthersOrders(restaurant, posid);
    const todaysTotalAmountBromagOrders = await getTodaysTotalAmountBromagOrders(restaurant, posid);

    const todaysTotalAmountTakeAway = await getTodaysTotalAmountTakeAway(
      restaurant,
      posid
    );
    const todaysTotalAmountDineIn = await getTodaysTotalAmountDineIn(
      restaurant,
      posid
    );
    const todaysTotalOrderdsInUPI = await getTodaysTotalOrderdsInUPI(
      restaurant,
      posid
    );

    console.log(todaysTotalOrders, "todaysTotalOrders");
    console.log(todaysTotalAmount, "todaysTotalAmount");
    console.log(todaysTotalAmountSwiggyOrders, "todaysTotalAmountSwiggyOrders");
    console.log(todaysTotalAmountZomatoOrders, "todaysTotalAmountZomatoOrders");
    console.log(todaysTotalAmountOthersOrders, "todaysTotalAmountOthersOrders");
    console.log(todaysTotalAmountBromagOrders, "getTodaysTotalAmountBromagOrders");
    console.log(todaysTotalAmountTakeAway, "todaysTotalAmountTakeAway");
    console.log(todaysTotalAmountDineIn, "todaysTotalAmountDineIn");

    // console.log(todaysTotalOrderdsInUPI, "todaysTotalOrderdsInUPI");

    res.status(200).json({
      success: true,
      message: "SuccessFully Fetched",
      todaysTotalAmount,
      todaysTotalAmountSwiggyOrders,
      todaysTotalAmountZomatoOrders,
      todaysTotalAmountOthersOrders,
      todaysTotalAmountBromagOrders,
      todaysTotalAmountTakeAway,
      todaysTotalAmountDineIn,
      todaysTotalOrders,
      todaysTotalOrderdsInUPI,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.getClosingData = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    if (validUser) {
      const data = await PosTodayClosing.find({
        restaurant: validUser.restaurant, 
        posId :validUser.id
      }).sort({date:-1});

      console.log(data, "heloo data");
      res.status(200).json({ success: true, data });
    } else {
      res.status(200).json({ success: false, message: "something went wrong" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.fetchPassbookData = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const posId = req.id;
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const data = await PosTodayClosing.find({
        restaurant: validUser.restaurant,
        posId: posId,
      }).sort({date:-1});
      res.status(200).json({ success: true, data });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.fetchTodaysfloatingCash = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const posid = req.id;
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

      // Calculate the end of the day (midnight of the next day)
      const endOfDay = new Date(today);
      endOfDay.setDate(today.getDate() + 1);

      const queryForExpense = {
        date: { $gte: today, $lt: endOfDay },
        posId: new mongoose.Types.ObjectId(posid),
        restaurant: new mongoose.Types.ObjectId(validUser.restaurant),
      };

      const Expensedata = await PosTodayExpense.aggregate([
        { $match: queryForExpense },
        {
          $group: {
            _id: null,
            totalExpense: { $sum: { $toDouble: "$amount" } },
          },
        },
      ]);

      const query = {
        restaurantId: validUser.restaurant,
        posManagerId: posid,
        date: { $gte: today, $lt: endOfDay },
        billId: { $exists: true, $ne: null },
      };

      const Floatingdata = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$Amount" },
          },
        },
      ]);

      console.log(Expensedata, Floatingdata, "helooda");

      res.status(200).json({ success: true, Floatingdata, Expensedata });
    } else {
      res.status(500).json({ success: true, message: "something went wrong" });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.getexpenseData = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    if (validUser) {
      const data = await PosTodayExpense.find({
        restaurant: validUser.restaurant,
        posId:validUser.id
      }).sort({date:-1});

      res.status(200).json({ success: true, data });
    } else {
      res.status(500).json({ success: true, data });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};

exports.adminPassbookDateFilter = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (restaurant) {
      const { start, end } = req.body;

   

    
      
      return res.json({ success: true, data: filteredData });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.takeAwayData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;

    if (isRestaurant) {

      if (isPosManager) {
        const takeAwayData = await Order.find({
          restaurantId: isRestaurant,
          posManagerId: isPosManager,
          orderMode: "takeaway",
          billId: { $exists: true },
        }).sort({date:-1});
   
        const HoldTakeAwayData = await Order.find({
          restaurantId: isRestaurant,
          posManagerId: isPosManager,
          orderMode: "takeaway",
          orderStatus: "holded",
          billId: { $exists: false },
        });

        return res.json({ success: true, takeAwayData, HoldTakeAwayData });

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

exports.addLeads = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    const { customerName, phone, email, maritalStatus, dob, anniversaryDate } =
      req.body;
    if (isRestaurant) {
      if (isPosManager) {
        const newLeadData = new Leads({
          customerName: customerName,
          phone: phone,
          email: email,
          dob: dob,
          maritalStatus: maritalStatus,
          anniversaryDate: anniversaryDate,
          restaurant: isRestaurant,
          posManagerId: isPosManager,
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

// to get the lead data at pos
exports.getLeadsData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;

    if (isRestaurant) {
      if (isPosManager) {
        const LeadsDetails = await Leads.find({
          restaurant: isRestaurant,
          posManagerId: isPosManager,
        });
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

// to drop the lead data
exports.deleteLeadData = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const isPosManager = req.id;

    const { LeadId } = req.body;
    if (restaurant) {
      if (isPosManager) {
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

// getting lead data to edit
exports.getToEditLead = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const isPosManager = req.id;
    const leadId = req.params.leadId;

    if (restaurant) {
      if (isPosManager) {
        const LeadsData = await Leads.findOne({
          _id: leadId,
          restaurant: restaurant,
          posManagerId: isPosManager,
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

// to update the lead section at pos
exports.updateLeads = async (req, res) => {
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

// to get the online data
exports.onlineData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;

    if (isRestaurant) {
      if (isPosManager) {
        const OnlineData = await Order.find({
          restaurantId: isRestaurant,
          posManagerId: isPosManager,
          orderMode: { $in: ["Zomato", "Swiggy", "Others", "Bromag"] },
        }).sort({ date: -1, orderTime: -1 });

const firstItem = OnlineData[0]
console.log(firstItem,"helooo");
        console.log(OnlineData.length, "kottt");
        console.log(JSON.stringify(OnlineData, null, 2),"i amaaaaa");
        return res.json({ success: true, OnlineData, firstItem });
        
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

// to get the dining data
exports.getDineIn = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    if (isRestaurant) {
      if (isPosManager) {
        const DineInDetails = await Order.find({
          restaurantId: isRestaurant,
          orderMode: "dineIn",
        }).populate("tableId").sort({ _id: -1 });

        // console.log(DineInDetails, "DineInDetails");
        res.json({ success: true, DineInData: DineInDetails });
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

//customer data is collecting from take away to lead
exports.takeAwayUserToLead = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    const { customerName, phone } = req.body;
    if (isRestaurant) {
      if (isPosManager) {
        const existingLead = await Leads.findOne({
          phone,
          restaurant: isRestaurant,
          posManagerId: isPosManager,
        });

        if (existingLead) {
          res.status(200).json({
            success: false,
            message: `${customerName} is your lead customer!`,
          });
        } else {
          const newLeadData = new Leads({
            customerName: customerName,
            phone: phone,
            restaurant: isRestaurant,
            posManagerId: isPosManager,
          });
          await newLeadData.save();
          res.json({
            success: true,
            message: "Customer data recorded to Lead!",
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

const calculateTotalItemPrice = (quantity, price, discountPrice) => {
  const finalPrice = discountPrice ? discountPrice : price;
  return quantity * finalPrice;
};
const convertObjectToKotItem = (obj) => {
  const { _id, orderedQuantity, item, actualPrice, discountPrice } = obj;
  const price = discountPrice ? discountPrice : actualPrice;
  const totalItemPrice = calculateTotalItemPrice(orderedQuantity, actualPrice, discountPrice);

  return {
    id: _id,
    quantity: orderedQuantity,
    item,
    price,
    totalItemPrice,
  };
};

exports.holdItemsAtPos = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const isPosManager = req.id;
    const {orderData,TotalPrice,kotData,orderId} = req.body
    const { customerName } = orderData;
   
    console.log(orderId,customerName,TotalPrice,kotData, "orderId");

    let KotItems = []
    let totalOrderAmount = 0;
    for (const obj of kotData) {
      const kotItem = convertObjectToKotItem(obj);
      KotItems.push(kotItem);
      totalOrderAmount += kotItem.totalItemPrice;
    }
console.log(KotItems,totalOrderAmount,"i am kot itemsss");

    
    if (isRestaurant) {
      if (isPosManager) {
        await Order.updateOne(
          { _id: orderId },
          {
            orderStatus: "holded",
            KotItems: KotItems,
            Amount:totalOrderAmount
          }
        );
   

        // const updatedOrder = await Order.findOne({ _id: orderId });
        // console.log(updatedOrder, "kju");

        // const totalAmount = updatedOrder.KotItems.reduce(
        //   (accumulator, item) => accumulator + item.totalItemPrice,
        //   0
        // );

        // await Order.updateOne({ _id: orderId }, { Amount: totalAmount });
        res.json({
          success: true,
          // updatedOrder,
          message: `${customerName}'s order is successful!`,
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
