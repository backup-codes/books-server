const Order = require("../model/order_model");
const AccessedEmployees = require("../model/access_model");
const moment = require('moment');
const { takeAwayData } = require("./pos_controller");

exports.getOnlineData = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (restaurant) {
      const orderData = await Order.find({
        restaurantId: restaurant,
        orderMode: { $in: ['Zomato', 'Swiggy', 'Bromag', 'Others'] },
      }).sort({ date: -1 });
      res.status(200).json({ success: true, OnlineOrderData: orderData });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getTakeAwayForAdmin = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;

    if (isRestaurant) {
      const takeAwayData = await Order.find({
        restaurantId: isRestaurant,
        orderMode: "takeaway",
        billId: { $exists: true },
      }).sort({date:-1});

      return res.json({ success: true, takeAwayData });
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

exports.getDineInForAdmin = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const DineInDetails = await Order.find({
        restaurantId: isRestaurant,
        orderMode: "dineIn",
      }).sort({date:-1});
      

      return res.json({ success: true, DineInDetails });
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

/**
 * This function retrieves the total sales data for a specific restaurant.
 * It returns a JSON response containing the sales data sorted by date in descending order.
 */
exports.getTotalSalesData = async (req, res) => {
  try {
    // Check if the user is authenticated as a restaurant
    const restaurant = req.restaurant;

    if (restaurant) {
      // Use the Order model to find all orders for the restaurant and sort them by date in descending order
      const orderData = await Order.find({
        restaurantId: restaurant,
      }).sort({date:-1});

      console.log(orderData);

      // Return a JSON response containing the sales data
      res.json({ success: true, SalesData: orderData });
    } else {
      // If the user is not authenticated as a restaurant, return an error message
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getSalesDashboardData = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const { start, end } = req.query;
    if (restaurant) {
      // to return total sales per day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day
      
      // Calculate the start and end of the last hour
      // const lastHourStart = new Date(today);
       // Set the time to the start of the last hour
      // const lastHourEnd = new Date(today);
      
      const totalSalesPerDay = await Order.aggregate([
        {
          $match: {
            restaurantId: restaurant,
            date: { $gte: today } // Filter orders for today and onwards
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$Amount" },
          },
        },
      ]);
      
      const todaySalesAmount = totalSalesPerDay.length > 0 ? totalSalesPerDay[0].totalAmount : 0;
      
      const now = new Date();
const lastHourStart = new Date(now);
lastHourStart.setMinutes(0, 0, 0); // Set minutes and seconds to 0 to start from the beginning of the hour
lastHourStart.setHours(now.getHours() - 1); // Set the hour to the hour before the current hour

const lastHourEnd = new Date(lastHourStart); // Make a copy of lastHourStart
lastHourEnd.setMinutes(59, 59, 999); // Set minutes, seconds, and milliseconds to end of the hour

// Perform the aggregation query for hourly sales amount
const hourlySalesAmount = await Order.aggregate([
  {
    $match: {
      restaurantId: restaurant,
      date: {
        $gte: lastHourStart,
        $lte: lastHourEnd // Use $lte to include the last hour
      }
    }
  },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$Amount" }
    }
  }
]);

const totalSalesAmountForLastHour = hourlySalesAmount.length > 0 ? hourlySalesAmount[0].totalAmount : 0;
console.log("Total sales amount for the last hour:", totalSalesAmountForLastHour);

      

      


      
      
      
      // Now you have hourly sales amounts for each hour, you can further process or display them as needed
      
      
      
      
      const startDate = new Date(start);
      const endDate = new Date(end);

      const Yesterdays = await Order.aggregate([
        {
          $match: {
            restaurantId: restaurant,
            date: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$Amount" },
          },
        },
      ]);

      if (totalSalesPerDay.length === 0) {
        return res.json({ success: true, totalSalesPerDay: {} });
      }

   

      // Get today's start and end time
      const currentHour = moment().hour();
      const startOfToday = moment().startOf('day');
      const startOfCurrentHour = moment().startOf('hour');
      const endOfCurrentHour = moment().endOf('hour');
      
      const HighestBillingAmountForCurrentHour = await Order.aggregate([
        {
          $match: {
            billId: { $exists: true },
            restaurantId: restaurant,
            date: {
              $gte: startOfToday.toDate(),
              $lt: endOfCurrentHour.toDate() // End of the current hour
            }
          }
        },
        {
          $group: {
            _id: null,
            maxAmount: { $max: "$Amount" }
          }
        }
      ]);
      
      const maxAmountForCurrentHour = HighestBillingAmountForCurrentHour.length > 0 ? HighestBillingAmountForCurrentHour[0].maxAmount : 0;
      
      console.log("Max billing amount for the current hour:", maxAmountForCurrentHour);
      

      

      
      

      const averageBillingAmountPerDay = await Order.aggregate([
        {
          $match: {
            restaurantId: restaurant,
          },
        },
        {
          $group: {
            _id: {
              startDate: {
                $dateToString: { format: "%Y-%m-%d", date: new Date(start) },
              },
              endDate: {
                $dateToString: { format: "%Y-%m-%d", date: new Date(end) },
              },
            },
            totalAmount: { $sum: "$Amount" },
            totalDays: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            startDate: "$_id.startDate",
            endDate: "$_id.endDate",
            averageAmountPerDay: { $divide: ["$totalAmount", "$totalDays"] },
          },
        },
      ]);

      // const now = new Date();
      const oneHourAgo = new Date(now);
      oneHourAgo.setHours(now.getHours() - 1);

      const OnlineAggregatesPerHour = await Order.aggregate([
        // online aggregates
        {
          $match: {
            billId: { $exists: true, $ne: "" },
            paymentMethod: { $exists: true, $ne: null },
            date: { $gte: oneHourAgo, $lt: now },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
          },
        },
      ]);


      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Set the start of the day to 00:00:00
const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); // Set the end of the day to 00:00:00 of the next day

const TakeAwayTotalAmount = await Order.aggregate([
  // take away data
  {
    $match: {
      orderMode: "takeaway",
      billId: { $exists: true, $ne: "" },
      date: { $gte: startOfDay, $lt: endOfDay },
    },
  },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$Amount" }, // Assuming the field containing the order amount is named "Amount"
    },
  },
  {
    $project: {
      _id: 0,
      totalAmount: 1,
    },
  },
]);

      const totalTakeAwayTotalAmount =
      TakeAwayTotalAmount.length > 0 ? TakeAwayTotalAmount[0].totalAmount : 0;



const DineInPerDay = await Order.aggregate([
  // dining data
  {
    $match: {
      orderMode: "dineIn",
      billId: { $exists: true, $ne: "" },
      date: { $gte: startOfDay, $lt: endOfDay },
    },
  },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$Amount" }, // Assuming the field containing the order amount is named "Amount"
    },
  },
  {
    $project: {
      _id: 0,
      totalAmount: 1,
    },
  },
]);

      const totalDineInPerDay =
        DineInPerDay.length > 0 ? DineInPerDay[0].totalAmount : 0;
      
      
        const TotalOnlineAggregatorSalesAmount = await Order.aggregate([
          {
            $match: {
              orderMode: { $in: ['Zomato', 'Swiggy', 'Bromag', 'Others'] },
              billId: { $exists: true, $ne: "" },
              date: { $gte: startOfDay, $lt: endOfDay },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$Amount" }, // Assuming the field containing the order amount is named "Amount"
            },
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1,
            },
          },
        ]);
      
     const TotalOnlineSales = TotalOnlineAggregatorSalesAmount?TotalOnlineAggregatorSalesAmount[0].totalAmount:0
      
      res.json({
        success: true,
        TotalSalesPerDay: totalSalesPerDay[0],
        Yesterdays,
        averageBillingAmountPerDay: averageBillingAmountPerDay[0],
        HighestBillingAmountPerHr: maxAmountForCurrentHour,
        OnlineAggregatesPerHour: OnlineAggregatesPerHour,
        totalTakeAwayTotalAmount: totalTakeAwayTotalAmount,
        totalDineInPerDay: totalDineInPerDay,
        TotalOnlineSales:TotalOnlineSales,
        hourlySalesAmount: totalSalesAmountForLastHour

      });

    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getOrderData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;

    if (isRestaurant) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const now = new Date();
      const oneHourAgo = new Date(now);
      oneHourAgo.setHours(now.getHours() - 1);

      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      const TotalOrder = await Order.find({ restaurantId: isRestaurant });

      // Today Orders Per Day
      const TodayOrdersPerDay = await Order.countDocuments({
        date: { $gte: today },
        billId: { $exists: true, $ne: null },
        restaurantId: isRestaurant,
      });

     

      const totalQuantity = new Map();

      // total order per day
      TotalOrder.forEach((value) => {
        value.KotItems.forEach((product) => {
          const { item, quantity } = product;
          totalQuantity.set(item, (totalQuantity.get(item) || 0) + quantity);
        });
      });

      let mostQuantityProduct;
      let mostQuantity = 0;

      totalQuantity.forEach((quantity, product) => {
        if (quantity > mostQuantity) {
          mostQuantity = quantity;
          mostQuantityProduct = product;
        }
      });

      const OnlineAggregatesPerHour = await Order.aggregate([
        // online aggregates
        {
          $match: {
            billId: { $exists: true, $ne: "" },
            paymentMethod: { $exists: true, $ne: null },
            date: { $gte: oneHourAgo, $lt: now },
            restaurantId:isRestaurant

          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
          },
        },
      ]);

      const TakeAwayPerHour = await Order.aggregate([
        // take away data
        {
          $match: {
            orderMode: "takeaway",
            billId: { $exists: true, $ne: "" },
            date: { $gte: oneHourAgo, $lt: now },
            restaurantId:isRestaurant
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalCount: 1,
          },
        },
      ]);

      const totalTakeAwayPerHour =
        TakeAwayPerHour.length > 0 ? TakeAwayPerHour[0].totalCount : 0;

      const DineInPerHour = await Order.aggregate([
        // dining data
        {
          $match: {
            orderMode: "dineIn",
            billId: { $exists: true, $ne: "" },
            date: { $gte: oneHourAgo, $lt: now },
            restaurantId:isRestaurant
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalCount: 1,
          },
        },
      ]);

      const totalDineInPerHour =
        DineInPerHour.length > 0 ? DineInPerHour[0].totalCount : 0;

      // yesterday's data
      const YesterdayOrders = await Order.find({
        date: { $gte: yesterday, $lt: today },
        billId: { $exists: true, $ne: null },
        restaurantId: isRestaurant,
      });

      const yesterdayTotalQuantity = new Map();

      // total order per day
      YesterdayOrders.forEach((value) => {
        value.KotItems.forEach((product) => {
          const { item, quantity } = product;
          yesterdayTotalQuantity.set(
            item,
            (yesterdayTotalQuantity.get(item) || 0) + quantity
          );
        });
      });

      let yesterdayMostQuantityProduct;
      let yesterdayMostQuantity = 0;

      yesterdayTotalQuantity.forEach((quantity, product) => {
        if (quantity > yesterdayMostQuantity) {
          yesterdayMostQuantity = quantity;
          yesterdayMostQuantityProduct = product;
        }
      });

      console.log(yesterdayMostQuantity, yesterdayMostQuantityProduct, "pop");

      return res.json({
        success: true,
        CompleteOrder: TotalOrder,
        mostQuantityProduct,
        mostQuantity,
        TodayOrdersPerDay,
        YesterdayOrders,
        OnlineAggregates: OnlineAggregatesPerHour,
        TakeAwayPerHour: totalTakeAwayPerHour,
        DineInPerHour: totalDineInPerHour,
      });
    } else {
      res.json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    console.log(error);
  return  res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * This function retrieves the total number of dine-in orders and total sales for dine-in orders for the current date.
 * It returns a JSON response containing the total number of dine-in orders and total sales for the current date.
 */
exports.TodaysOrderDataOfCap = async (req, res) => {
  try {
    // Get the current date and extract the date part only
    const todayDate = new Date().toISOString().split('T')[0];

    // Check if the user is authenticated as a restaurant
    const isRestaurant = req.restaurant;

    if (isRestaurant) {
      // Use the Order model to aggregate the total number of dine-in orders for the current date
      const totalDineInOrders = await Order.aggregate([
        {
          $match: {
            restaurantId: isRestaurant,
            orderMode: 'dineIn',
            date: {
              $gte: new Date(todayDate + "T00:00:00.000Z"),
              $lt: new Date(todayDate + "T23:59:59.999Z"),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDineInOrders: { $sum: 1 },
          },
        },
      ]);

      // Use the Order model to aggregate the total sales for dine-in orders for the current date
      const totalDineInSales = await Order.aggregate([
        {
          $match: {
            restaurantId: isRestaurant,
            orderMode: 'dineIn',
            date: {
              $gte: new Date(todayDate + "T00:00:00.000Z"),
              $lt: new Date(todayDate + "T23:59:59.999Z"),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$Amount" },
          },
        },
      ]);

      // Log the total number of dine-in orders and total sales for the current date
      console.log(totalDineInOrders, totalDineInSales);

      // Calculate the total number of dine-in orders and total sales for the current date
      const TotalOrdersInDinIn = totalDineInOrders.length > 0? totalDineInOrders[0].totalDineInOrders : 0;
      const TotalSalesInDinIn = totalDineInSales.length > 0? totalDineInSales[0].totalSales : 0;

      // Return a JSON response containing the total number of dine-in orders and total sales for the current date
      return res.status(200).json({ success: true, message: "SuccessFully Fetched", TodayDineInOrdersPerDay: TotalOrdersInDinIn, TodaysSalesInDineIn: TotalSalesInDinIn });
    }
  } catch (err) {
    // If there is an error, log it and return an internal server error message
    console.log(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getOrderDataOfCap = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const captainId = req.params.captainId;

    
    if (isRestaurant) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const now = new Date();
      const oneHourAgo = new Date(now);
      oneHourAgo.setHours(now.getHours() - 1);

      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);



      if (captainId=='all') {
  
        console.log(captainId,"calleddd no capsis");

     
        const TodayDineInOrdersPerDay = await Order.countDocuments({
          orderMode: "dineIn",
          date: { $gte: today },
          billId: { $exists: true, $ne: null },
          restaurantId: isRestaurant,
          
        });
        
        
        
   
      const todayDate = new Date().toISOString().split('T')[0];
        
   const todaysDineInTotalSalesByCapId = await  Order.aggregate([
        {
          $match: {
            date: { $gte: new Date(todayDate), $lt: new Date(todayDate + 'T23:59:59.999Z') },
            restaurantId: isRestaurant, // Replace with the actual restaurantId
            orderMode: "dineIn",
            billId: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalSalesAmount: { $sum: "$Amount" },
          },
        },
   ])
        console.log(todaysDineInTotalSalesByCapId,"todaysDineInTotalSalesByCapId");
      
      const todaysDineInSalesAmount = todaysDineInTotalSalesByCapId.length > 0 ? todaysDineInTotalSalesByCapId[0].totalSalesAmount
      : 0;
      
        
      const TotalDineInOrders = await Order.countDocuments({
        orderMode: "dineIn",
        billId: { $exists: true, $ne: null },
        restaurantId: isRestaurant,

      });  
      
      
      return res.json({
        success: true,
        message:"fetched All Dinin Sales",
        todaysDineInSalesAmount:todaysDineInSalesAmount,
        TodayDineInOrdersPerDay: TodayDineInOrdersPerDay,
        TotalDineInOrders,
      });
        
      }  else  if (captainId ) {
  
        
        const TodayDineInOrdersPerDay = await Order.countDocuments({
          orderMode: "dineIn",
          date: { $gte: today },
          billId: { $exists: true, $ne: null },
          restaurantId: isRestaurant,
          capManagerId: captainId,
        });
        
        
        
   
      const todayDate = new Date().toISOString().split('T')[0];
        
   const todaysDineInTotalSalesByCapId = await  Order.aggregate([
        {
          $match: {
            date: { $gte: new Date(todayDate), $lt: new Date(todayDate + 'T23:59:59.999Z') },
            restaurantId: isRestaurant, // Replace with the actual restaurantId
            capManagerId: captainId, // Replace with the actual capManagerId
            orderMode: "dineIn",
            billId: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            totalSalesAmount: { $sum: "$Amount" },
          },
        },
   ])
        
      
      const todaysDineInSalesAmount = todaysDineInTotalSalesByCapId.length > 0 ? todaysDineInTotalSalesByCapId[0].totalSalesAmount
      : 0;
      
        
      const TotalDineInOrders = await Order.countDocuments({
        orderMode: "dineIn",
        billId: { $exists: true, $ne: null },
        restaurantId: isRestaurant,
        capManagerId:captainId
      });  
      
      
      return res.json({
        success: true,
        message:"fetched Specific  Captain  DinIn Sales",
        todaysDineInSalesAmount:todaysDineInSalesAmount,
        TodayDineInOrdersPerDay: TodayDineInOrdersPerDay,
        TotalDineInOrders,
      });
  

      } else {
         res.status(200).json({success:false,message:"CapId unavailable"})

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

exports.getSalesDataOfCap = async (req, res) => {
  try {
    // Check if the user is authenticated as a restaurant
    const isRestaurant = req.restaurant;

    if (isRestaurant) {
      // Use the Order model to aggregate the sales data for dine-in orders in the restaurant
      const SalesAtCaptain = await Order.aggregate([
        {
          // Match only dine-in orders for the restaurant
          $match: {
            orderMode: 'dineIn',
            restaurantId: isRestaurant,
          },
        },
        {
          // Group the data by date and calculate the total sales and total orders for each date
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$date" }
              },
            },
            totalSales: { $sum: '$Amount' },
            totalOrders: { $sum: 1 },
          },
        },
        {
          // Sort the data in descending order by date
          $sort: {
            "_id.date": -1,
          },
        },
      ]);

      // Return the sales data as a JSON response
      return res.json({
        SalesAtCaptain,
        success: true,
      });
    } else {
      // If the user is not authenticated as a restaurant, return an error message
      res.json({
        success: false,
        message: "Your session expired, Please login!",
      });
    }
  } catch (error) {
    // If there is an error, log it and return an internal server error message
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
