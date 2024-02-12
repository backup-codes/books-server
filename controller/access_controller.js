const { sendEmail } = require("../middleware/mailer");
const Restaurant = require("../model/restaurant_model");
const AccessedEmployees = require("../model/access_model");
const mongoose = require("mongoose");
const Employees = require("../model/employees_model");
const Customers = require("../model/customer_model");
const Venders = require("../model/vendors_model");
const Ingredients = require("../model/ingredients_model");
const jwtToken = require("jsonwebtoken");
const helpers = require("../utils/helpers");
const PosTodayOpeningBalance = require("../model/posTodayOpeningBalance");
const posTodayClosing = require("../model/posTodayClosing");
const VendorInvoice = require("../model/vendor_Invoice_model");
const Stock = require("../model/stock_model");
const StockIn = require("../model/stock_in");
const {
  ListBucketInventoryConfigurationsOutputFilterSensitiveLog,
} = require("@aws-sdk/client-s3");
const StockOut = require("../model/stock_out");
const { generateEmployId } = require("../middleware/employ_Id");
const feedback_model = require("../model/feedback_model");


exports.getAllRegisteredPos = async (req, res) => {
  try {
    
    if (req.restaurant) {

      const response = await AccessedEmployees.find({
        accessFor: "POS manager",
        restaurant: req.restaurant
      }).select('username _id');
      

      if (response.length > 0) {
        res.status(200).json({success:true,message:"Successfully Fetched",RegisteredPosManagers:response})
      } else {
        res.status(200).json({success:false,message:"PosManagers didn't Exist"})
      }



    }

  } catch (err) {
    console.log(err);
  return  res.status(500).json({success:true,message:"Internal Server Error "})
  }
}



exports.GetRestaurantDetail = async (req, res) => {
  try {
    console.log(req.restaurant, "restaurant token");
    let restaurantData
    if (req.restaurant) {
  
      restaurantData = await Restaurant.findById(req.restaurant)
      
      
      return res.status(200).json({success:true,message:"Successfully Fetched",restaurantData})
    } else {
      
      return res.status(200).json({success:false,message:"Something Went Wrong",restaurantData})
    }

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: true, message: "Internal Server Error " })
  }
}


exports.getAllSalesReport = async (req, res) => {
  try {
    const restro = req.restaurant;
    const {POSManager,date} = req.query
    console.log(POSManager, "i am you");
    let response
console.log(date,"datee");
    if (date) {

      console.log(date);
      
      const { start, end } = date
      const startDate = new Date(start);
      const endDate = new Date(end);
   
      if (POSManager === 'All') {
        
        console.log(restro,POSManager,"heyy");
     
      response  = await posTodayClosing.find({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
          restaurant: restro,
        }).sort({ date: -1 });
        
        console.log(response,"from date all");
        
      } else {
  
      response = await posTodayClosing.find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        restaurant: restro,
        posId: POSManager
        
      }).sort({ date: -1 });
      
      console.log(response,"from date ",POSManager);
        
      }


      return res.json({ success: true, data: response });


    } else {
      
    
      if (POSManager === 'All') {
      
        response = await posTodayClosing.find({
          restaurant: restro,
        }).sort({date:-1});
      
      } else {
      
        response = await posTodayClosing.find({
          restaurant: restro,
          posId: POSManager
        }).sort({date:-1});
      
        console.log(response, " I am response");
      }
    
      return res.json({ success: true, data: response });
    }

  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal error occured" });
  }

};

exports.getStockInDetails = async (req, res) => {
  try {
    const restro = req.restaurant;
    const data = await StockIn.find({ restaurant: restro })
      .sort({ date: -1 })
      .populate({
        path: "VendorId",
        model: "Venders", // Replace with the actual model name for Venders
        select: "vendorName vendorId", // Specify the fields you want to retrieve for Venders
      });

    return res.status(200).json({
      message: "Successfully Fetched",
      success: true,
      stockInData: data,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
exports.getStockOutDetails = async (req, res) => {
  try {
    const restro = req.restaurant;

    const data = await StockOut.find({ restaurant: restro }).sort({ date: -1 });

    return res.status(200).json({
      message: "Successfully Fetched",
      success: true,
      stockOutData: data,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

exports.commodityStockOut = async (req, res) => {
  try {
    const restaurantId = req.restaurant;
    const { commodity, quantity, description } = req.body;

    const response = await Stock.findOne({
      commodityName: commodity,
      restaurant: restaurantId,
    }).select("quantity");

    if (response.quantity < quantity) {
      return res.status(200).json({
        success: false,
        message: "Please enter quantity lesser or equal to current stock",
      });
    } else {
      const balance = response.quantity - quantity;

      if (balance) {
        const newStockOutData = {
          date: new Date(),
          description: description,
          commodity: commodity,
          previousStock: response.quantity,
          stockOutward: quantity,
          balanceStock: balance,
          restaurant: new mongoose.Types.ObjectId(restaurantId),
        };

        const newStockOut = new StockOut(newStockOutData);

        const updatedStock = await Stock.updateOne(
          { commodityName: commodity, restaurant: restaurantId },
          { $set: { quantity: balance } }
        );
        console.log(updatedStock, "updated stock");

        newStockOut.save();
        return res.status(200).json({
          success: true,
          message: "Stock updated!",
        });
      } else {
        console.log("balance not found ", balance);
        return res.status(200).json({
          success: false,
          message: "Balance not found",
        });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.getPassBookData = async (req, res) => {
  try {
    const adminId = req.id;
    const restaurant = req.restaurant;

    //OpeningCash

    const data = await PosTodayOpeningBalance.find({
      restaurant: restaurant,
    });
    //floating Cash
    //closing cash
  } catch (err) {
    console.log(err);
  }
};

exports.verifyLogin = async (req, res) => {
  try {
    const Employee = req.body.data;
    const employee = await Restaurant.findOne({
      username: Employee.username,
    });
    if (employee) {
      if (Employee.password === employee.password) {
        const token = jwtToken.sign(
          { id: employee._id },
          process.env.SECRET_KEY,
          {
            expiresIn: "30d",
          }
        );

        const encodedToken = btoa(token);
        const dashboardLink = `${process.env.CLIENT}/link-verification/token/${encodedToken}`;



        const mailFormat = {
          to: employee.email,
          subject: "Bromag India Private Limited : Open your account",
          html:
            "<h4>Hai dear,</h4><br><p>Welcome back to Bromag India! Use " +
            `Click the link to access your dashboard: ${dashboardLink}`,
        };



        // const mailFormat = {
        //   to: employee.email,
        //   subject: "Bromag India Private Limited : Open your account",
        //   html:`<!DOCTYPE html>
        //   <html lang="en">
          
        //   <head>
        //       <meta charset="UTF-8">
        //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
          
        //       <!-- google fonts -->
        //       <link rel="preconnect" href="https://fonts.googleapis.com">
        //       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        //       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;800&display=swap" rel="stylesheet">
          
          
        //       <title>Document</title>
        //   </head>
          
        //   <body style="margin: 0px; box-sizing: border-box; overflow-x: hidden; width: 100%; height: 100%; font-family: 'Inter', sans-serif; color: #404040; font-weight: 400; display: flex; justify-content: center; align-items: center;">
        //       <div
        //           style='width: 700px;background-color: #E5E5E5;display:flex; align-items:center;justify-content: center; padding-left: 80px ;padding-right:80px'>
        //           <div align="center" style='width: 100%;height: 100%;  align-items:center;justify-content: center'>
        //               <header
        //                   style='width: 100%;background-color: #0059C2;color:#fff;padding: 10px 50px;border-radius: 30px 30px 0px 0px;'>
        //                   <h1 style='font-weight: 600;'>Welcome to Bromag Books!</h1>
        //               </header>
          
        //               <section style='width: 100%;padding:50px 50px;background-color:#fff;border-radius: 0px 0px 30px 30px'>
        //                   <div>
        //                       <div style='display: flex;align-items: center;column-gap: 7px;'>
        //                           <h4 style='margin: 5px 0px'>Dear</h4>
        //                           <p style='margin: 5px 0px'>[Restaurant Owner/Manager],</p>
        //                       </div>
          
        //                       <div>
        //                           <p style='margin: 10px 0px'>Welcome to Bromag Books! We are delighted to have you on board, and
        //                               we are confident that our billing solution will streamline your restaurant's operations and
        //                               enhance your overall efficiency.
        //                           </p>
        //                       </div>
        //                   </div>
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>Your Account Details:</h4>
        //                       <p style='margin: 5px 0px'>Your account has been set up. You can log in using the following
        //                           credentials:</p>
        //                       <div
        //                           style='width: 30%;background-color:#B3C3DA40;padding: 5px 30px; border-radius: 10px;margin-top: 20px;'>
        //                           <p>Username: [username]</p>
        //                           <p>Password: [password]</p>
        //                       </div>
        //                       <div
        //                           style='width: 100%;margin: 30px 0px;display: flex;flex-direction: column; align-items: center;   '>
        //                           <img style='width: 77px;height:104px;' src="../assets/images/email-bg.png" alt="">
        //                           <p>Click on the button below to redirect to your restaurant home page</p>
        //                           <a style='background-color:#00418D;color: #fff;padding: 10px 50px;border-radius: 25px; text-decoration:none'
        //                               href='${dashboardLink}'>
        //                               Click here
        //                           </a>
        //                       </div>
        //                   </div>
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>Getting to Know Bromag Books:</h4>
        //                       <p style='margin: 5px 0px'>
        //                           Your account has to take a few minutes to explore the intuitive features of our web app. From easy
        //                           menu
        //                           setup, table
        //                           management to seamless order tracking and we've designed it to simplify your billing process.
        //                       </p>
        //                   </div>
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>User Guides and Tutorials</h4>
        //                       <p style='margin: 5px 0px'>
        //                           To help you get started, we have prepared user guides and tutorials. Access them [insert link to
        //                           guides/tutorials] to
        //                           familiarize yourself with the key functionalities.
        //                       </p>
        //                   </div>
          
        //                   <p style='margin-top: 40px;font-size: 20px;'>Setting Up Your Restaurant</p>
          
        //                   <div>
        //                       <h4 style='margin: 5px 0px'>1. Menu Configuration:</h4>
        //                       <p style='margin: 10px 0px'>
        //                           Navigate to the menu configuration section to input your restaurant's offerings accurately. You
        //                           can
        //                           add/edit items, set prices, and customize categories to match your menu structure.
        //                       </p>
        //                   </div>
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>2. Table Management:</h4>
        //                       <p style='margin: 10px 0px'>
        //                           Efficiently manage your restaurant's dining areas using our Table Management System.
        //                       </p>
          
        //                       <p>Here's how to get started:</p>
          
        //                       <ul style='list-style-type: lower-alpha;'>
        //                           <li style='margin:10px 0px'>
        //                               Access the Captain Management section in the web app.
        //                           </li>
        //                           <li style='margin:10px 0px'>
        //                               Add tables and customize the layout based on your restaurant's floor plan.
        //                           </li>
        //                           <li style='margin:10px 0px'>
        //                               Easily track the status of each table, including occupied, available, and reserved.
        //                           </li>
        //                           <li style='margin:10px 0px'>
        //                               Improve overall customer experience by ensuring smooth table turnover
        //                           </li>
        //                       </ul>
        //                   </div>
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>Need Help?</h4>
        //                       <p style='margin: 5px 0px'>
        //                           If you have any questions or encounter any issues during the onboarding process, our support
        //                           team is
        //                           ready to assist
        //                           you.
        //                       </p>
        //                   </div>
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>Contact Us</h4>
        //                       <div
        //                           style='width: 30%;background-color:#B3C3DA40;padding: 5px 30px; border-radius: 10px;margin-top: 20px;'>
        //                           <p>Mail ID: [mail id]</p>
        //                           <p>Phone: [contact number]</p>
        //                       </div>
        //                   </div>
          
          
        //                   <div style='margin-top: 40px'>
        //                       <h4 style='margin: 10px 0px'>Onboarding Assistance:</h4>
        //                       <p style='margin: 5px 0px'>
        //                           For personalized onboarding assistance, we offer live training sessions. Schedule a session by
        //                           replying to this email
        //                           with your preferred time, and a member of our team will guide you through the setup process
          
        //                       </p>
        //                   </div>
          
        //                   <h2 style='text-align: center;margin-top: 50px;font-weight: 600'>We Are Here For You!</h2>
        //               </section>
        //           </div>
        //       </div>
        //   </body>
          
        //   </html>`,
        // };



        sendEmail(mailFormat.to, mailFormat.subject, mailFormat.html);
        res.json({
          success: true,
          token,
          message: `Welcome ${employee.username}!`,
        });
      } else {
        console.log("!password");
        res.json({ success: false, message: "Incorrect password!" });
      }
    } else {
      res.json({ success: false, message: "Not matches in our record!" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, serverMessage: "Internal Server Error" });
  }
};

exports.access = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    const restaurant = validUser.id;
    const validRestaurant = await Restaurant.findOne({ _id: restaurant });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, serverMessage: "Internal Server Error" });
  }
};

exports.searchCustomerDetail = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    console.log(validUser, "heyy");
    const restaurant = validUser.id;
    const searchValue = req.params.query;
    const restaurantId = req.restaurant;

    console.log(restaurantId);
    const query = {
      restaurant: new mongoose.Types.ObjectId(restaurantId),
    };

    

    if (searchValue) {

      if (!isNaN(searchValue)) {
        // If searchValue is a valid number, use direct equality match
        console.log("case 1");
        query.phone = searchValue;
      } else {
        
        query.$or = [
          { customer: { $regex: searchValue, $options: "i" } },
          { email: { $regex: searchValue, $options: "i" } },
          { city: { $regex: searchValue, $options: "i" } },
          { address: { $regex: searchValue, $options: "i" } },
          
        ];
      }
    }

    const result = await Customers.find(query);

 
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    
    return res
      .status(500)
      .json({ success: false, serverMessage: "Internal Server Error" });
  }
};

exports.getAllvendors = async (req, res) => {
  try {
    const restro = req.restaurant;
    const data = await Venders.find({ restaurant: restro });
    if (data > 0) {
      return res.status(200).json({
        success: true,
        message: "SuccessFully fetched",
        vendors: data,
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Please add a Vendor", vendors: data });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, serverMessage: "Internal Server Error" });
  }
};

exports.getCommidities = async (req, res) => {
  try {
    const restro = req.restaurant;

    const response = await VendorInvoice.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restro),
        },
      },
      {
        $unwind: "$commodities",
      },
      {
        $group: {
          _id: "$commodities.commodity",
        },
      },
      {
        $project: {
          _id: 0,
          commodity: "$_id",
        },
      },
    ]);
    if (response.length > 0) {
      const commodities = response.map((entry) => entry.commodity);

      return res.status(200).json({
        success: true,
        message: "Successfully Fetched",
        commodities: commodities,
      });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, serverMessage: "Internal Server Error" });
  }
};

exports.accessedEmployees = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (restaurant) {
      const adminData = await Restaurant.findById(restaurant);
      const accessedEmployees = await AccessedEmployees.find({
        restaurant: restaurant,
        adminStatus: false,
      });
      res.json({
        success: true,
        adminData,
        accessedEmployees,
      });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, serverMessage: "Internal Server Error" });
  }
};

exports.generateNextEmployeeId = async (req, res) => {
  try {
    const lastEmployee = await AccessedEmployees.find()
      .sort({ employeeId: -1 })
      .limit(1);

    const lastEmployeeIdNumber =
      lastEmployee.length > 0
        ? parseInt(lastEmployee[0].employeeId.slice(4), 10)
        : 0;

    const nextEmployeeIdNumber = lastEmployeeIdNumber + 1;

    const paddedNextEmployeeIdNumber = String(nextEmployeeIdNumber).padStart(
      3,
      "0"
    );

    const nextEmployeeId = `BIPL${paddedNextEmployeeIdNumber}`;

    return nextEmployeeId;
  } catch (err) {
    console.log(err);
  }
};

exports.updatAccess = async (req, res) => {
  try {
    const { username, password, email, accessAs, ID } = req.body;
    const file = req.files[0];
    const restaurant = req.restaurant;
console.log(accessAs,"i am accesss");
    const response = await AccessedEmployees.findOne({ _id: ID });

    if (!response) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const updates = {};

    if (username) updates.username = username;
    if (password) updates.password = password;
    if (email) updates.email = email;
    if (accessAs) updates.accessFor = accessAs;

    if (file) {
console.log(file," i am file");      
      
      
      const imagePath=`access/profileImage/${restaurant}/${file.filename}`;
      
      
      await helpers.uploadFile(file,imagePath);
      
      helpers.deleteFile(file.path);

      updates.profileImage = helpers.getS3FileUrl(imagePath);
      console.log(updates.profileImage);
      await helpers.deleteS3File(response.profileImage);


    }

    await AccessedEmployees.updateOne({ _id: ID }, { $set: updates });

    return res
      .status(200)
      .json({ success: true, message: "Update successful" });
    
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.addAccess = async (req, res) => {
  try {
    
    const { username, password, email, accessAs } = req.body;
    const file = req.files[0];
    const employeeId = await this.generateNextEmployeeId();

    if (username) {
      const existingUsername = await AccessedEmployees.findOne({ username });
      const existingEmail = await AccessedEmployees.findOne({ email });

      if (existingUsername) {
        return res.status(200).json({
          success: false,
          message: "Username already exist Please choose another one",
        });
      } else if (existingEmail) {
        return res.status(200).json({
          success: false,
          message: "Email already exist Please choose another one",
        });
      }

      const isRestaurant = req.restaurant;
      if (file) {
        const imagePath = `access/profileImage/${isRestaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        const imageURL = helpers.getS3FileUrl(imagePath);

        helpers.deleteFile(file.path);

        const newAccess = new AccessedEmployees({
          username: username,
          password: password,
          email: email,
          profileImage: imageURL,
          accessFor: accessAs,
          employeeId: employeeId,
          restaurant: req.restaurant,
        });

        await newAccess.save();

        return res
          .status(200)
          .json({ success: true, message: `${accessAs}'s access inserted!` });
      }
    } else {
      res.status(200).json({ success: false, message: "Somehing went wrong" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Somehing went wrong" });
    console.log(error);
  }
};

exports.deleteEmployeeAccess = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (restaurant) {
      const { employId } = req.body;

      const response = await AccessedEmployees.findOne({ _id: employId });

      if (response.profileImage) {
        await helpers.deleteS3File(response.profileImage);
      }

      await AccessedEmployees.findOneAndDelete({
        _id: employId,
        restaurant: restaurant,
      });

      res
        .status(200)
        .json({ success: true, message: "Employee details deleted !" });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.addEmployDetails = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    console.log(req.body);
    if (isRestaurant) {
      const {
        employ,
        dob,
        currentAddress,
        email,
        permanentAddress,
        phone,
        gender,
        maritalStatus,
        aadharNumber,
        pancardNumber,
        pfNumber,
        uanNumber,
        emergencyContactName,
        emergencyContactAddress,
        emergencyContactNumber,
        emergencyContactPersonRelation,
        esiNumber,
        bloodGroup,
        employID,
      } = req.body;
      const aadharImage = req.files["aadharImage"][0];
      const pancardImage = req.files["pancardImage"][0];
      const aadharImagePath = `employee/aadharImages/${isRestaurant}/${aadharImage.filename}`;
      const pancardImagePath = `employee/pancardImages/${isRestaurant}/${pancardImage.filename}`;

      await helpers.uploadFile(aadharImage, aadharImagePath);
      await helpers.uploadFile(pancardImage, pancardImagePath);

      const aadhar = helpers.getS3FileUrl(aadharImagePath);
      const pancard = helpers.getS3FileUrl(pancardImagePath);

      helpers.deleteFile(pancardImage.path);
      helpers.deleteFile(aadharImage.path);

      const existingEmployee = await Employees.findOne({ employID });
      if (existingEmployee) {
        const updatedData = {
          staff: employ,
          current_address: currentAddress,
          email: email,
          gender: gender,
          aadhar_number: aadharNumber,
          pan_number: pancardNumber,
          pf_number: pfNumber,
          uan_number: uanNumber,
          phone: phone,
          emergency_contact_person_name: emergencyContactName,
          emergency_contact_person_address: emergencyContactAddress,
          permanent_address: permanentAddress,
          dob: dob,
          marital_status: maritalStatus,
          aadhar_image: aadhar,
          pancard_image: pancard,
          esi_number: esiNumber,
          blood_group: bloodGroup,
          emergency_contact_person_number: emergencyContactNumber,
          emergency_contact_person_relation: emergencyContactPersonRelation,

          status: true,
        };

        await Employees.updateOne({ employID }, { $set: updatedData });
        res
          .status(200)
          .json({ success: true, message: `${employ}'s details recorded!` });
      } else {
        res.json({
          success: false,
          message: "Employ ID is not matching in our collection",
        });
      }
    } else {
      res.json({
        success: false,
        message: "Session expired!",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.employDetails = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const employeeData = await Employees.find({
        restaurantId: isRestaurant,
      }).sort({joinDate:-1  });
      res.status(200).json({
        success: true,
        EmployData: employeeData,
      });
    } else {
      res.json({
        success: false,
        message: "Session expired!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.addEmploymentDetails = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const { email, joinDate, employeeType, designation, employ } = req.body;
      const employID = await generateEmployId();
      const isExist = await Employees.findOne({
        restaurantId: isRestaurant,
        email: email,
      });
      if (!isExist) {
        const newUser = new Employees({
          restaurant: isRestaurant,
          employID: employID,
          email: email,
          joinDate: joinDate,
          employeeType: employeeType,
          designation: designation,
          staff: employ,
          restaurantId: isRestaurant,
        });
        await newUser.save();
        res.status(200).json({
          success: true,
          message: `${employ}'s details inserted as ${designation}.`,
        });
      } else {
        res.json({
          success: false,
          message: "This employee is already exist!",
        });
      }
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.addCustomer = async (req, res) => {
  try {

    console.log("called");
    
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);


    const {
      customer,
      phone,
      email,
      city,
      state,
      zipcode,
      limit,
      address,
      aadharNumber,
    } = req.body;

    const files = req.files;

    const restaurant = validUser.restaurant;

console.log(files,restaurant,"i am customer");

    if (restaurant) {
      let aadharImages= []

    const result = await Customers.findOne({ phone: phone });
    
  
    
    if (result) {
      return res
      .status(200)
      .json({ success: false, message: "Phone number already exist" });
    }
    const response = await Customers.findOne({ email: email });
    if (response) {
      return  res.status(200).json({ success: false, message: "Email already exist" });
    }
    
      
    if (files) {
        

      for (const file of req.files) {
        // const imageURL = await S3uploadFile(file.originalname, file.buffer);

        const imagePath = `customer/aadharImages/${restaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        helpers.deleteFile(file.path);

        const imageURL = helpers.getS3FileUrl(imagePath);

        // Store the URL in the array
        aadharImages.push(imageURL);
      }

   
      
    } 
      
    
    const newUser = new Customers({
      customer: customer,
      phone: phone,
      address: address,
      email: email,
      city: city,
      state: state,
      zipcode: zipcode,
      limit: limit,
      balance: limit,
      aadharImage: aadharImages,
      aadharNumber: aadharNumber,
      restaurant: validUser.restaurant,
    });
      
    await newUser.save();
    return res.status(200).json({
      success: true,
      message: `${customer}'s details stored successfully!`,
    }); 
      
  }
  } catch (error) {
    console.log(error);
  }


  
};

exports.customerDetails = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    if (validUser) {
      const customerData = await Customers.find({
        restaurant: validUser.restaurant,
      });
      res.status(200).json({ success: true, customerData: customerData });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: true, message: "Something Went Wrong" });
  }
};

exports.getcustomerDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const customerData = await Customers.findById(id);
    res.status(200).json({ success: true, customerData: customerData });
  } catch (error) {}
};

exports.updateCustomerDetail = async (req, res) => {
  try {
    
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);

    
// const Token = token.replace(/"/g, "");
    // const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    const restaurant = validUser.restaurant;
    
    const {
      customer,
      email,
      phone,
      limit,
      zipcode,
      address,
      city,
      aadharNumber,
      state,
      id,
    } = req.body;

    const files = req.files;


    if (restaurant) {

      console.log("entered restro");
      const data = await Customers.findById(id);
      let aadharImages = []

      const resultByPhone = await Customers.findOne({ phone: phone, _id: { $ne: id } });

          
    if (resultByPhone) {
      return res
      .status(200)
      .json({ success: false, message: "Phone number already exist" });
    }

    const resultByEmail = await Customers.findOne({ email: email, _id: { $ne: id } });
    if (resultByEmail) {
      return  res.status(200).json({ success: false, message: "Email already exist" });
      }
      

      if (files.length>0) {
        console.log("entered files>0");
     
        for (const imageUrl of data.aadharImage) {
          await helpers.deleteS3File(imageUrl);
        }

        for (const file of files) {
          // const imageURL = await S3uploadFile(file.originalname, file.buffer);
          

          const imagePath = `customer/aadharImages/${restaurant}/${file.filename}`;
  
          await helpers.uploadFile(file, imagePath);
  
          helpers.deleteFile(file.path);
  
          const imageURL = helpers.getS3FileUrl(imagePath);
  
          // Store the URL in the array
          console.log(imageURL," i am urllll");
          aadharImages.push(imageURL);
        }
  
      } 
        
console.log(aadharImages," iam aadhar images arrays");

const updateFields = {
  $set: {
    customer,
    email,
    phone,
    limit,
    zipcode,
    address,
    city,
    aadharNumber,
    state,
  },
      };
      
      
      if (aadharImages && aadharImages.length > 0) {
        updateFields.$set.aadharImage = aadharImages;
      }
      
      const result = await Customers.updateOne(
        { _id: id },
        updateFields
      );


    

      if (data.limit == data.balance) {
        await Customers.updateOne(
          { _id: id },
          {
            $set: {
              balance: limit,
            },
          }
        );
      }

      if (result.modifiedCount <= 0) {
        res.json({ success: false, message: "No change found" });
      } else if (result.modifiedCount > 0) {
        res.json({ success: true, message: "Updated Successfully" });
      } else {
        res.json({ success: false, message: "Something went wrong" });
      }
      
    } else {
      res.json({ success: false, message: "RestroId Unavailable" });
      
    }
  } catch (error) {
    console.log(error," i am error");
    res.json({ success: false, message: "Something went wrong" });
  }
};

exports.deleteCustomerDetail = async (req, res) => {
  try {
    const customerId = req.params.Id;

    const customerData = await Customers.find({ _id: customerId });

    console.log(customerData, "customeree prevented delete temporory");
    // const deleteResult = await Customers.deleteOne({ _id: customerId });

    res.json({ success: true, message: "Deletion successfull" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendor_id = req.body.vendor_id;

    const response = await Venders.deleteOne({ _id: vendor_id });

    res.status(200).json({ success: true, message: "Successfully deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

exports.accessRestaurantHome = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (token != null) {
      const Token = token.replace(/"/g, "");
      const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
      const restaurant = validUser.id;
      const validRestaurant = await Restaurant.findOne({
        _id: restaurant,
      }).select("-password");
      res.json({ success: true, restaurantData: validRestaurant });
    } else {
      res.json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.adminLoginVerification = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const { password, username } = req.body;
    const Token = token.replace(/"/g, "");
    const validRestaurant = jwtToken.verify(Token, process.env.SECRET_KEY);

    console.log(validRestaurant, "validated Restaurant Id");
    const restaurant = await Restaurant.findById(validRestaurant.id);
    console.log(restaurant, "validated restaurant");

    if (restaurant) {
      console.log(restaurant);
      const admin = await AccessedEmployees.findOne({
        password: password,
        username: username,
        adminStatus: true,
        restaurant: restaurant._id,
      });
      console.log(admin, "validated admin");

      if (admin) {
        const token = jwtToken.sign(
          { id: admin._id, role: "owner", restaurant: restaurant.id },
          process.env.SECRET_KEY,
          {
            expiresIn: "30d",
          }
        );

        res.json({
          success: true,
          Token: token,
          message: `Welcome ${admin.username}`,
        });
      } else {
        res.json({ success: false, message: "Invalid Credentials" });
      }
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.error("Error during admin login verification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.employeeSignInVerification = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const Token = token.replace(/"/g, "");
    const validUser = jwtToken.verify(Token, process.env.SECRET_KEY);
    const { username, password } = req.body;
    const employee = await AccessedEmployees.findOne({
      $and: [
        { username: username },
        { password: password },
        { adminStatus: { $ne: true } },
        { restaurant: validUser.id },
      ],
    });
    if (employee) {
      const designation = employee.accessFor;

      let responseData = { success: true };

      if (designation === "POS manager") {
        const token = jwtToken.sign(
          { id: employee._id, role: "pos", restaurant: validUser.id },
          process.env.SECRET_KEY,
          {
            expiresIn: "30d",
          }
        );
        responseData.PosManager = true;
        responseData.token = token;
      } else if (designation === "Captain manager") {
        const token = jwtToken.sign(
          { id: employee._id, role: "cap", restaurant: validUser.id },
          process.env.SECRET_KEY,
          {
            expiresIn: "30d",
          }
        );
        responseData.Captain = true;
        responseData.token = token;
      } else {
        responseData.OtherDesignation = true;
      }

      res.json(responseData);
    } else {
      res.json({ success: false, message: "Username or password incorrect!" });
    }
  } catch (error) {
    console.error("Error during employee login verification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.generateVendorId = async (req, res) => {
  try {
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var uniqueID = "";

    // First character is always an uppercase letter
    uniqueID += "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(
      Math.floor(Math.random() * 26)
    );

    // Generate the rest of the ID
    for (var i = 1; i < 6; i++) {
      var randomIndex = Math.floor(Math.random() * characters.length);
      uniqueID += characters.charAt(randomIndex);
    }

    const isExist = await Venders.findOne({ vendorId: uniqueID });
    if (isExist) {
      return await this.generateVendorId();
    }
    return uniqueID;
  } catch (err) {
    console.log(err);
  }
};

exports.getAllVendorCategories = async (req, res) => {
  try {
    const restro = req.restaurant;
    const ingredient = await Venders.distinct("ingredient", {
      restaurant: restro,
    });
    if (ingredient < 0) {
      return res
        .status(200)
        .json({ success: false, message: "No Category at all" });
    }

    return res.status(200).json({
      success: true,
      message: "Succefully fetched",
      category: ingredient,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.addVenderDetails = async (req, res) => {
  try {
    const file = req.file;
    const restaurant = req.restaurant;
    const VendorId = await this.generateVendorId();
    let imagePath;
    const {
      AccountNumber,
      BranchCode,
      GST,
      category,
      contact,
      vendorName,
      neft,
    } = req.body;

    if (file) {
      imagePath = `vender/vendorProof/${restaurant}/${file.filename}`;
      helpers.uploadFile(file, imagePath);
      ImageURL = helpers.getS3FileUrl(imagePath);

      helpers.deleteFile(file.path);

      const vendorData = new Venders({
        ingredient: category,
        vendorId: VendorId,
        vendorName: vendorName,
        phone: contact,
        billImage: ImageURL,
        gst: GST,
        neft: neft,
        branchCode: BranchCode,
        accountNumber: AccountNumber,
        restaurant: restaurant,
      });

      await vendorData.save();

      return res
        .status(200)
        .json({ success: true, message: "Vendor details successFully  saved" });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "Unable to upload Proof" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.updateVenderDetails = async (req, res) => {
  try {
    const file = req.file;
    const restaurant = req.restaurant;
    let imagePath;
    const {
      AccountNumber,
      BranchCode,
      GST,
      category,
      contact,
      vendorName,
      neft,
      id,
    } = req.body;
    const vendorData = await Venders.find({ _id: id });

    if (file) {
      imagePath = `vender/vendorProof/${restaurant}/${file.filename}`;

      helpers.deleteS3File(vendorData.billImage);
      helpers.uploadFile(file, imagePath);

      ImageURL = helpers.getS3FileUrl(imagePath);

      helpers.deleteFile(file.path);

      const updateData = {
        $set: {
          ingredient: category,
          vendorName: vendorName,
          phone: contact,
          billImage: ImageURL,
          gst: GST,
          neft: neft,
          branchCode: BranchCode,
          accountNumber: AccountNumber,
          restaurant: restaurant,
        },
      };

      await Venders.updateOne({ _id: id }, updateData);
    } else {
      const updateData = {
        $set: {
          ingredient: category,
          vendorName: vendorName,
          phone: contact,
          gst: GST,
          neft: neft,
          branchCode: BranchCode,
          accountNumber: AccountNumber,
          restaurant: restaurant,
        },
      };

      await Venders.updateOne({ _id: id }, updateData);
    }

    return res
      .status(200)
      .json({ success: true, message: "Vendor details successFully  saved" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.getVenderDetails = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const vendorsData = await Venders.find({ restaurant: isRestaurant }).sort({addedDate:-1});
      res.status(200).json({ success: true, VendorData: vendorsData });
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
    console.log(error);
  }
};

exports.addIngredientsDetails = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    const {
      description,
      vendorDetails,
      commodities,
      totalAmount,
      paymentMode,
    } = req.body;
    const [vendor_id, vendorID, companyName, vendorNumber] =
      vendorDetails.split(" - ");

    const comoditiesArray = JSON.parse(commodities);

    if (restaurant) {
      const file = req.file;

      let ImageURL;

      if (file) {
        const imagePath = `vender/ingredients/${restaurant}/${file.filename}`;

        await helpers.uploadFile(file, imagePath);

        ImageURL = helpers.getS3FileUrl(imagePath);

        helpers.deleteFile(file.path);
        console.log(ImageURL, "url");
      }

      const isExist = await Venders.findOne({ _id: vendor_id });

      if (isExist) {
        const vendorInvoice = new VendorInvoice({
          vendorId: vendor_id,
          description: description,
          amount: totalAmount,
          paymentMode: paymentMode,
          billImage: ImageURL,
          restaurant: restaurant,
          vendorName: companyName,
          commodities: comoditiesArray,
        });

        // [ { commodity: 'Potato', Quantity: '8.9', Unit: 'kg' } ]

        for (const stockItem of comoditiesArray) {
          const quantity = parseFloat(stockItem.Quantity);
          const CommodityAmount = parseFloat(stockItem.CommodityAmount);

          await Stock.findOneAndUpdate(
            {
              commodityName: stockItem.commodity,
              restaurant: new mongoose.Types.ObjectId(restaurant),
            },
            {
              $inc: { quantity: quantity },
              $set: { unit: stockItem.Unit },
            },
            { upsert: true, new: true }
          );

          const newStockInEntry = new StockIn({
            date: new Date(),
            commodity: stockItem.commodity,
            stockInward: quantity,
            unit: stockItem.Unit,
            VendorId: new mongoose.Types.ObjectId(vendor_id),
            amount: CommodityAmount,
            billURL: ImageURL,
            restaurant: new mongoose.Types.ObjectId(restaurant),
          });

          await vendorInvoice.save();
          await newStockInEntry.save();
        }

        res.status(200).json({
          success: true,
          message: `Invoice recorded SuccessFully`,
        });
      } else {
        res.json({
          success: false,
          message: "This vendor ID is not found!",
        });
      }
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getIngredientsData = async (req, res) => {
  try {
    const restaurantId = req.restaurant;

    if (restaurantId) {
      console.log(restaurantId, "hey");
      const response = await VendorInvoice.find({ restaurant: restaurantId })
        .sort({ createdAt: -1 })
        .populate({
          path: "vendorId",
          model: "Venders", // Replace with the actual model name for Venders
          select: "vendorName vendorId", // Specify the fields you want to retrieve for Venders
        });

      return res.status(200).json({ success: true, IngredientsData: response });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.fetchAcessDetail = async (req, res) => {
  try {
    const ID = req.params.ID;
    const restaurant = req.restaurant;
    if (restaurant) {
      const response = await AccessedEmployees.find({
        _id: ID,
        restaurant: restaurant,
      });
      return res.status(200).json({ success: true, AccessData: response });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

async function getBillImagesForYesterday(restaurantId) {
  // Get the start and end of yesterday
  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date();
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  try {
    // Query the database for VendorInvoices created yesterday for the given restaurantId
    const invoices = await VendorInvoice.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
    });

    // Extract and return the billImages and vendorNames
    const billImagesByVendor = {};
    invoices.forEach((invoice) => {
      const { vendorName, billImage } = invoice;
      if (!billImagesByVendor[vendorName]) {
        billImagesByVendor[vendorName] = [billImage];
      } else {
        billImagesByVendor[vendorName].push(billImage);
      }
    });

    return billImagesByVendor;
  } catch (error) {
    console.error(
      "Error fetching yesterday's billImages and vendorNames:",
      error
    );
    throw error;
  }
}
async function getBillImagesForTodays(restaurantId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const invoices = await VendorInvoice.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Group billImages by vendorName
    const billImagesByVendor = {};
    invoices.forEach((invoice) => {
      const { vendorName, billImage } = invoice;
      if (!billImagesByVendor[vendorName]) {
        billImagesByVendor[vendorName] = [billImage];
      } else {
        billImagesByVendor[vendorName].push(billImage);
      }
    });

    return billImagesByVendor;
  } catch (error) {
    console.error(
      "Error fetching yesterday's billImages and vendorNames:",
      error
    );
    throw error;
  }
}

async function getBillImagesForLastWeek(restaurantId) {
  // Get the current date
  const currentDate = new Date();

  // Calculate the start and end of the last week (Monday to Saturday)
  const endOfLastWeek = new Date(currentDate);
  endOfLastWeek.setDate(
    endOfLastWeek.getDate() - ((endOfLastWeek.getDay() + 6) % 7)
  );
  endOfLastWeek.setHours(23, 59, 59, 999);

  const startOfLastWeek = new Date(endOfLastWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);
  startOfLastWeek.setHours(0, 0, 0, 0);

  try {
    // Query the database for VendorInvoices created in the last week for the given restaurantId
    const invoices = await VendorInvoice.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
    });

    // Extract and return the billImages and vendorNames
    // const billImagesAndVendorNames = invoices.map((invoice) => ({
    //   vendorName: invoice.vendorName,
    //   billImage: invoice.billImage,
    // }));

    const billImagesByVendor = {};
    invoices.forEach((invoice) => {
      const { vendorName, billImage } = invoice;
      if (!billImagesByVendor[vendorName]) {
        billImagesByVendor[vendorName] = [billImage];
      } else {
        billImagesByVendor[vendorName].push(billImage);
      }
    });

    return billImagesByVendor;
  } catch (error) {
    console.error("Error fetching billImages for the last week:", error);
    throw error;
  }
}

async function getBillImagesForLastMonth(restaurantId) {
  // Get the current date
  const currentDate = new Date();

  // Calculate the start and end of the last month
  const endOfLastMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0,
    23,
    59,
    59,
    999
  );
  const startOfLastMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1,
    0,
    0,
    0,
    0
  );

  try {
    // Query the database for VendorInvoices created in the last month for the given restaurantId
    const invoices = await VendorInvoice.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    // Extract and return the billImages and vendorNames
    const billImagesByVendor = {};
    invoices.forEach((invoice) => {
      const { vendorName, billImage } = invoice;
      if (!billImagesByVendor[vendorName]) {
        billImagesByVendor[vendorName] = [billImage];
      } else {
        billImagesByVendor[vendorName].push(billImage);
      }
    });

    return billImagesByVendor;
  } catch (error) {
    console.error("Error fetching billImages for the last month:", error);
    throw error;
  }
}

async function getBillImagesForLastYear(restaurantId) {
  // Get the current date
  const currentDate = new Date();

  // Calculate the start and end of the last year
  const endOfLastYear = new Date(
    currentDate.getFullYear() - 1,
    11,
    31,
    23,
    59,
    59,
    999
  );
  const startOfLastYear = new Date(
    currentDate.getFullYear() - 1,
    0,
    1,
    0,
    0,
    0,
    0
  );

  try {
    // Query the database for VendorInvoices created in the last year for the given restaurantId
    const invoices = await VendorInvoice.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfLastYear, $lte: endOfLastYear },
    });

    // Extract and return the billImages and vendorNames
    const billImagesByVendor = {};
    invoices.forEach((invoice) => {
      const { vendorName, billImage } = invoice;
      if (!billImagesByVendor[vendorName]) {
        billImagesByVendor[vendorName] = [billImage];
      } else {
        billImagesByVendor[vendorName].push(billImage);
      }
    });

    return billImagesByVendor;
  } catch (error) {
    console.error("Error fetching billImages for the last year:", error);
    throw error;
  }
}

const convertObjectToArray = (obj) => {
  return Object.entries(obj).map(([vendor, imageUrls]) => ({
    vendor,
    imageUrls,
  }));
};

exports.vendorDashboard = async (req, res) => {
  try {
    const restaurantId = req.restaurant;
    if (restaurantId) {
      const todays = await getBillImagesForTodays(restaurantId);

      const yesterday = await getBillImagesForYesterday(restaurantId);

      const lastweek = await getBillImagesForLastWeek(restaurantId);

      const lastmonth = await getBillImagesForLastMonth(restaurantId);

      const lastYear = await getBillImagesForLastYear(restaurantId);

      const todaysArray = convertObjectToArray(todays);
      const yesterdayArray = convertObjectToArray(yesterday);
      const lastweekArray = convertObjectToArray(lastweek);
      const lastmontharray = convertObjectToArray(lastmonth);
      const lastYeararray = convertObjectToArray(lastYear);

      res.status(200).json({
        success: true,
        message: "Successfully fetched",
        todaysArray,
        yesterdayArray,
        lastweekArray,
        lastYeararray,
        lastmontharray,
      });
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.StockDashboard = async (req, res) => {
  try {
    const restaurantId = req.restaurant;

    const stocks = await Stock.find({ restaurant: restaurantId });

    return res
      .status(200)
      .json({ success: true, message: "Successfully fetched", stocks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteEmploymentData = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (restaurant) {
      const { employId } = req.body;
      await Employees.findOneAndDelete({
        _id: employId,
        restaurantId: restaurant,
      });
      res
        .status(200)
        .json({ success: true, message: "Employment data deleted!" });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.vendorDateFilter = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (restaurant) {
      const { start, end } = req.body;

      const filteredData = await Ingredients.aggregate([
        {
          $match: {
            restaurant: restaurant,
            date: { $gte: new Date(start), $lte: new Date(end) },
          },
        },
        {
          $group: {
            _id: "$ingredient",
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ]);

      return res.json({ success: true, data: filteredData });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.menuManagement = async (req, res) => {
  try {
    const isRestaurant = req.restaurant;
    if (isRestaurant) {
      const Total = await Menu.aggregate([
        { $match: { restaurant: isRestaurant } },
        {
          $group: {
            _id: "$ingredient",
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ]);

      res.status(200).json({
        Total: Total,
        Today: Today,
        LastWeek: LastWeek,
        LastMonth: LastMonth,
        LastYear: LastYear,
        success: true,
      });
    } else {
      res.status(200).json({ success: false, message: "session expired" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getToEditEmploymentDetails = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (restaurant) {
      const employId = req.params.employId;
      const EmploymentData = await Employees.findOne({
        _id: employId,
        restaurant: restaurant,
      });
      if (EmploymentData) {
        res.json({ success: true, EmploymentData });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Employment not found" });
      }
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateEmploymentDetails = async (req, res) => {
  try {
    const employId = req.params.employId;
    // console.clear()
    console.log(req.files, "filesss",employId);
console.log(req.body,"bodyy");
    const {
      employ,
      dob,
      currentAddress,
      email,
      permanentAddress,
      phone,
      gender,
      maritalStatus,
      aadharNumber,
      pancardNumber,
      pfNumber,
      uanNumber,
      emergencyContactName,
      emergencyContactAddress,
      emergencyContactNumber,
      emergencyContactPersonRelation,
      esiNumber,
      bloodGroup,
    } = req.body;
    const restaurant = req.restaurant;
    
    if (restaurant) {
      
      const employee = await Employees.findOne({ _id: employId });

      let aadharImages = []
      let pancard
      
      if (req.files && Object.keys(req.files).length > 0) {
console.log(req.files);
        const aadharImage = req.files["aadharImage"]?req.files["aadharImage"]:false;

        const pancardImage = req.files["pancardImage"][0]?req.files["pancardImage"][0]:false

        
        
        if (aadharImage) {
 


          for (const file of aadharImage) {
            // const imageURL = await S3uploadFile(file.originalname, file.buffer);
  
            const imagePath = `employee/aadharImages/${restaurant}/${file.filename}`
  
            await helpers.uploadFile(file, imagePath);
          
            helpers.deleteFile(file.path);
          
            const imageURL = helpers.getS3FileUrl(imagePath);
          
            // Store the URL in the array
            aadharImages.push(imageURL);
          
          }
        

          if (employee.aadhar_image && employee.aadhar_image.length > 0) {
           
            for (const imageURL of employee.aadhar_image) {

              await helpers.deleteS3File(imageURL);
           
            }

          }

        }
      

        if (pancardImage) {
          
          const pancardImagePath = `employee/pancardImages/${restaurant}/${pancardImage.filename}`;
        
          await helpers.uploadFile(pancardImage, pancardImagePath);
        
           pancard = helpers.getS3FileUrl(pancardImagePath);
        
          helpers.deleteFile(pancardImage.path);

          const oldPanPicURL = employee.pancard_image;
        
          await helpers.deleteS3File(oldPanPicURL);


        
        }


      }

      // const updatedData = {
      //   staff: employ,
      //   current_address: currentAddress,
      //   email: email,
      //   gender: gender,
      //   aadhar_number: aadharNumber,
      //   pan_number: pancardNumber,
      //   pf_number: pfNumber,
      //   uan_number: uanNumber,
      //   phone: phone,
      //   emergency_contact_person_name: emergencyContactName,
      //   emergency_contact_person_address: emergencyContactAddress,
      //   permanent_address: permanentAddress,
      //   dob: dob,
      //   marital_status: maritalStatus,
      //   aadhar_image: aadharImages,
      //   pancard_image: pancard,
      //   esi_number: esiNumber,
      //   blood_group: bloodGroup,
      //   emergency_contact_person_number: emergencyContactNumber,
      //   emergency_contact_person_relation: emergencyContactPersonRelation,
      //   status: true,
      // };

    
      // console.log(updatedData, "updatedData");


      const updatedData = {
        staff: employ,
        current_address: currentAddress,
        email: email,
        gender: gender,
        aadhar_number: aadharNumber,
        pan_number: pancardNumber,
        pf_number: pfNumber,
        uan_number: uanNumber,
        phone: phone,
        emergency_contact_person_name: emergencyContactName,
        emergency_contact_person_address: emergencyContactAddress,
        permanent_address: permanentAddress,
        dob: dob,
        marital_status: maritalStatus,
        aadhar_image: aadharImages,
        pancard_image: pancard,
        esi_number: esiNumber,
        blood_group: bloodGroup,
        emergency_contact_person_number: emergencyContactNumber,
        emergency_contact_person_relation: emergencyContactPersonRelation,
        status: true,
      };
      
      // Remove properties with undefined, null, empty strings, or empty arrays
      Object.entries(updatedData).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          delete updatedData[key];
        }
      });
      
      const updatedEmployment = await Employees.findOneAndUpdate(
        { _id: employId, restaurant: restaurant },
        { $set: updatedData }
      );

      if (!updatedEmployment) {
        return res
          .status(404)
          .json({ success: false, message: "Employment not found" });
      }

      res.json({
        success: true,
        message: `${employ}'s data successfully updated`,
        // employment: updatedEmployment,
      });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateEmploymentData = async (req, res) => {
  try {
    const employId = req.params.employId;
    const { employ, joinDate, employeeType, email, designation } = req.body;
    const restaurant = req.restaurant;
    console.log("gere");

    if (restaurant) {
      const updatedEmployment = await Employees.findOneAndUpdate(
        { _id: employId },
        {
          $set: {
            email: email,
            joinDate: joinDate,
            employeeType: employeeType,
            designation: designation,
            staff: employ,
          },
        },
        { new: true }
      );

      if (!updatedEmployment) {
        return res
          .status(404)
          .json({ success: false, message: "Employment not found" });
      }

      res.json({
        success: true,
        message: `${employ}'s data successfully updated`,
        employment: updatedEmployment,
      });
    } else {
      res.json({ success: false, message: "Session expired!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.sendFeedback = async (req, res) => {
  try {
    console.log(req.body,"feedback");

    const isRestaurant = req.restaurant;
    const { name, email, phoneNumber, message } = req.body;
    if (isRestaurant) {
      const newFeedback = new feedback_model({
        name,
        email,
        phoneNumber,
        message,
      });
      // await newFeedback.save();
      res.json({ success: true, message: "Data saved successfully!" });
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
