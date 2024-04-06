const helpers = require("../utils/helpers");
const Table = require("../model/restaurant_table_model");
const AccessedEmployees = require("../model/access_model");
const Order = require("../model/order_model");

exports.addTableData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;

    if (isRestaurant) {
      const { numberOfSeats, tableNum, captain } = req.body;
      const file = req.files[0];

      const imagePath = `table/${isRestaurant}/${file.filename}`;

      await helpers.uploadFile(file, imagePath);

      const itemImage = helpers.getS3FileUrl(imagePath);

      helpers.deleteFile(file.path);

      const newTable = new Table({
        numberOfSeats,
        tableName: tableNum,
        restaurant: isRestaurant,
        image: itemImage,
        captainId: captain,
      });

      await newTable.save();

      res.status(200).json({ success: true, message: `Table counts updated!` });
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getTableDataAtAdmin = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const tableData = await Table.find({
        restaurant: isRestaurant,
      })
      console.log(tableData, "tableData");
      res.status(200).json({ success: true, tableData });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.updateTableActive = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const { tableId } = req.params;
      const { isShared } = req.body;
      const updatedTable = await Table.findByIdAndUpdate(
        tableId,
        {
          $set: {
            restaurant: isRestaurant,
            isShared: isShared,
          },
        },
        { new: true }
      );

      if (!updatedTable) {
        return res
          .status(404)
          .json({ success: false, message: "Table not found" });
      }

      res.json({ success: true, updatedTable });
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getToEditTableData = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (restaurant) {
      const tableId = req.params.tableId;
      const table = await Table.findOne({
        _id: tableId,
        restaurant: restaurant,
      });
      const captains = await AccessedEmployees.find({
        restaurant: restaurant,
        accessFor: "Captain manager",
      }).select("-password");
      
      if (table) {
        res.json({ success: true, table, captains ,table});
      } else {
        res.status(404).json({ success: false, message: "Category not found" });
      }
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateTableData = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    const tableId = req.params.tableId;
    const { tableNum, numberOfSeats ,captain} = req.body;

  
    
    if (isRestaurant) {
      let tableImage;

      if (req.files && req.files.length > 0) {
        const file = req.files[0];
        const table = await Table.find({ _id: tableId });

        const oldPicURL = table.image;

        await helpers.deleteS3File(oldPicURL);

        const imagePath = `table/${isRestaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        tableImage = helpers.getS3FileUrl(imagePath);

        helpers.deleteFile(file.path);
      }

      const updatedTable = await Table.updateOne(
        { _id: tableId },
        {
          $set: {
            tableName: tableNum,
            numberOfSeats: numberOfSeats,
            image: tableImage,
            captainId:captain
          },
        }
      );
console.log(updatedTable,"updatedTable");
      if (!updatedTable) {
        return res
          .status(404)
          .json({ success: false, message: "Table not found" });
      }

      res.json({
        success: true,
        message: "Table updated successfully",
        menu: updatedTable,
      });
    } else {
      res.json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.deleteTable = async (req, res) => {
  try {
    // Extract restaurant from request
    const restaurant = req.restaurant;
    
    // Check if the request is from a restaurant
    if (restaurant) {
      // Extract tableId from request body
      const { tableId } = req.body;
      
      // Find and delete the table based on its ID and associated restaurant
      const tableData = await Table.findOneAndDelete({
        _id: tableId,
        restaurant: restaurant,
      });
      
      // Send successful response with confirmation message
      res.status(200).json({
        success: true,
        message: `Table ${tableData.tableName} is deleted!`, // Include deleted table's name in message
      });
    } else {
      // Send failure message if the request is not from a restaurant
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);
  }
};




exports.captainList = async (req, res) => {
  try {
    // Check if the request comes from a restaurant
    const isRestaurant = req.restaurant;
    
    // If it's from a restaurant
    if (isRestaurant) {
      // Find captains associated with the restaurant
      const captains = await AccessedEmployees.find({
        restaurant: isRestaurant,
        accessFor: "Captain manager",
      }).select("-password"); // Exclude password field from the result
      
      // Count total dine-in orders for the restaurant
      const TotalDineInOrders = await Order.countDocuments({
        orderMode: "dineIn",
        billId: { $exists: true, $ne: null }, // Check if billId exists and is not null
        restaurantId: isRestaurant,
      });
      
      // Send successful response with captains list and total dine-in orders
      res.status(200).json({ success: true, captains, TotalDineInOrders });
    } else {
      // If request is not from a restaurant, send failure message
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);
  }
};



exports.captainPassFilter = async (req, res) => {
  try {
    // Extract restaurant from request
    const restaurant = req.restaurant;

    // Check if the request is from a restaurant
    if (restaurant) {
      // Extract start and end dates from request body
      const { start, end } = req.body;

      // Aggregate orders based on specified criteria
      const filteredData = await Order.aggregate([
        {
          $match: {
            orderMode: 'dineIn',
            restaurantId: restaurant,
            date: {
              $gte: new Date(start), // Filter orders from start date
              $lte: new Date(end + 'T23:59:59.999Z'), // Filter orders till end of end date
            },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%d-%m-%Y", date: "$date" } // Group orders by formatted date
              },
            },
            totalSales: { $sum: '$Amount' }, // Calculate total sales
            totalOrders: { $sum: 1 }, // Count total orders
          },
        },
        {
          $sort: { '_id.date': -1 } // Sort results by date in descending order
        }
      ]);

      // Send successful response with filtered data
      return res.json({ success: true, data: filteredData });
      
    } else {
      // Send failure message if the request is not from a restaurant
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    // Log any errors that occur during the process
    console.log(error);
  }
};

