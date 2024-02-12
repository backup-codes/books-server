const express = require("express");
const userRouter = express.Router();
//controllers
const controller = require("../controller/access_controller");
const menuController = require("../controller/menu_controller");
const posController = require("../controller/pos_controller")
const capController = require("../controller/cap_controller")
const salesController = require("../controller/sales_controller")
const tableController = require("../controller/table_controller")
//middleware
const interceptor = require("../middleware/interceptor");


const upload = require('../utils/uploaders')


/* restaurant */
userRouter.post("/login", controller.verifyLogin);
userRouter.get('/accessRestaurantHome' ,controller.accessRestaurantHome)


/* restaurant owner */
userRouter.post('/adminLoginVerification' ,controller.adminLoginVerification)

userRouter.patch('/updateProfileImage', upload.ImageUploader.array('profileImage', 1), interceptor.posAuth, posController.updateProfileImagePos)
userRouter.post("/addAccess", upload.ImageUploader.array('image', 1), interceptor.adminAuth, controller.addAccess); 

userRouter.patch("/updatEmployeAccess",upload.ImageUploader.array('image', 1),interceptor.adminAuth,controller.updatAccess); 
userRouter.get("/accessedEmployees",interceptor.adminAuth,controller.accessedEmployees);
userRouter.delete("/deleteEmployeeAccess", interceptor.adminAuth, controller.deleteEmployeeAccess);

userRouter.post('/addEmploymentDetails' ,interceptor.adminAuth, controller.addEmploymentDetails) //Employee management 
userRouter.post('/deleteEmploymentData' ,interceptor.adminAuth, controller.deleteEmploymentData) 
userRouter.get('/employDetails' ,interceptor.adminAuth ,controller.employDetails)
userRouter.get('/getToEditEmploymentDetails/:employId' ,interceptor.adminAuth ,controller.getToEditEmploymentDetails)
userRouter.post(
  '/updateEmploymentDetails/:employId',
  upload.ImageUploader.fields([
    { name: "aadharImage", maxCount: 2 },
    { name: "pancardImage", maxCount: 1 },
  ]),
  interceptor.adminAuth,
  controller.updateEmploymentDetails
);


userRouter.post('/updateEmploymentData/:employId' ,interceptor.adminAuth ,controller.updateEmploymentData)

// userRouter.post("/addEmployDetails", upload.ImageUploader.fields([{ name: "aadharImage", maxCount: 1 },
// { name: "pancardImage", maxCount: 1 },]),interceptor.adminAuth,controller.addEmployDetails);

userRouter.post('/addMenuCategory' ,interceptor.adminAuth ,menuController.addMenuCategory)// menu's category related
userRouter.get('/getMenuCategory' ,interceptor.adminAuth ,menuController.getMenuCategory)
userRouter.post('/deleteMenuCategory' ,interceptor.adminAuth ,menuController.deleteMenuCategory)
userRouter.get('/getToEditMenuCategory/:categoryId' ,interceptor.adminAuth ,menuController.getToEditMenuCategory)
userRouter.post('/updateMenuCategory/:categoryId', interceptor.adminAuth, menuController.updateMenuCategory)


userRouter.get('/getStockInDetails', interceptor.adminAuth, controller.getStockInDetails)
userRouter.get('/getStockOutDetails', interceptor.adminAuth, controller.getStockOutDetails)
userRouter.post('/commodityStockOut', interceptor.adminAuth, controller.commodityStockOut)



userRouter.post("/addMenuData", upload.ImageUploader.single('ItemImage'), interceptor.adminAuth, menuController.addMenuData);// menu management

userRouter.patch("/updateMenuData", upload.ImageUploader.single('ItemImage'), interceptor.adminAuth, menuController.updateMenuData);// menu management
userRouter.patch("/updateOnlineAggregatorPrices", interceptor.adminAuth, menuController.updateOnlineAggregatorPrices);// menu management

userRouter.get('/getMenuData' ,interceptor.adminAuth ,menuController.getMenuData)
userRouter.put('/updateMenuActive/:itemId', interceptor.adminAuth, menuController.updateMenuActive);
userRouter.post('/menuSharingUpdates', interceptor.adminAuth, menuController.menuSharingUpdates);
userRouter.post('/publishMenu', interceptor.adminAuth, menuController.publishMenu);
userRouter.post('/quantityIncrementAtMenu', interceptor.adminAuth, menuController.quantityIncrementAtMenu);
userRouter.post('/deleteMenu' ,interceptor.adminAuth ,menuController.deleteMenu)
userRouter.get('/menu-management' ,interceptor.adminAuth ,menuController.menuManagement)
userRouter.post("/menuDateFilter",interceptor.adminAuth,menuController.menuDateFilter);
userRouter.get('/getToEditMenu/:Id' ,interceptor.adminAuth ,menuController.getToEditMenu)
userRouter.post('/updateMenu/:Id' ,upload.ImageUploader.array('itemImage', 1),interceptor.adminAuth ,menuController.updateMenu)


userRouter.get('/getTakeAwayForAdmin' ,interceptor.adminAuth ,salesController.getTakeAwayForAdmin)//sales management
userRouter.get('/getDineInForAdmin' ,interceptor.adminAuth ,salesController.getDineInForAdmin)
userRouter.get('/getOnlineData' ,interceptor.adminAuth, salesController.getOnlineData) 
userRouter.get('/getTotalSalesData' ,interceptor.adminAuth, salesController.getTotalSalesData)
userRouter.get('/getSalesDashboardData' ,interceptor.adminAuth, salesController.getSalesDashboardData)

userRouter.get('/getOrderData' ,interceptor.adminAuth, salesController.getOrderData)// order related
userRouter.get('/getOrderDataOfCap/:captainId' ,interceptor.adminAuth, salesController.getOrderDataOfCap)
userRouter.get('/TodaysOrderDataOfCap' ,interceptor.adminAuth, salesController.TodaysOrderDataOfCap)
userRouter.get('/getSalesDataOfCap' ,interceptor.adminAuth, salesController.getSalesDataOfCap)


userRouter.post("/addTableData",upload.ImageUploader.array('image', 1), interceptor.adminAuth,tableController.addTableData);//table management
userRouter.get('/getTableDataAtAdmin' , interceptor.adminAuth,tableController.getTableDataAtAdmin)
userRouter.put('/updateTableActive/:tableId', interceptor.adminAuth, tableController.updateTableActive);
userRouter.get('/getToEditTableData/:tableId' ,interceptor.adminAuth ,tableController.getToEditTableData)
userRouter.post('/updateTableData/:tableId' ,upload.ImageUploader.array('image', 1),interceptor.adminAuth ,tableController.updateTableData)
userRouter.post('/deleteTable' ,interceptor.adminAuth ,tableController.deleteTable)
userRouter.get('/captainList' ,interceptor.adminAuth ,tableController.captainList)
userRouter.post('/captainPassFilter' ,interceptor.adminAuth ,tableController.captainPassFilter)



userRouter.post('/addCustomer',upload.ImageUploader.array('aadharImage') ,controller.addCustomer) // customer management
userRouter.get('/customerDetails' ,interceptor.adminAuth,controller.customerDetails)
userRouter.get('/getCustomerDetail/:id', interceptor.adminAuth, controller.getcustomerDetail)

userRouter.patch('/updateCustomer', upload.ImageUploader.array('aadharImage'),  controller.updateCustomerDetail)
// userRouter.patch('/updateCustomer', () => {
//   console.log("updateddddd trauilssss");
// })

userRouter.delete('/deleteCustomer/:Id', controller.deleteCustomerDetail)
userRouter.delete('/deleteVendor',interceptor.adminAuth, controller.deleteVendor)
userRouter.get('/customerDetail/:query',interceptor.adminAuth,controller.searchCustomerDetail)
userRouter.get('/getAllvendors',interceptor.adminAuth,controller.getAllvendors)
userRouter.get('/getCommidities',interceptor.adminAuth,controller.getCommidities)


userRouter.get('/TodaysAdminPassbookData' , interceptor.adminAuth,posController.TodaysAdminPassbookData)
userRouter.get('/getPassBookData' , interceptor.adminAuth,posController.getPassBookData)// pos related
userRouter.post("/adminPassbookDateFilter",interceptor.adminAuth,posController.adminPassbookDateFilter);

userRouter.get('/getAllVendorCategories' ,interceptor.adminAuth, controller.getAllVendorCategories)

userRouter.post('/addVenderDetails' ,interceptor.adminAuth, upload.ImageUploader.single('image') ,controller.addVenderDetails)// vendor related
userRouter.post('/updateVenderDetails' ,interceptor.adminAuth, upload.ImageUploader.single('image') ,controller.updateVenderDetails)// vendor related

userRouter.post('/addIngredientsDetails' ,upload.ImageUploader.single('image'),interceptor.adminAuth,controller.addIngredientsDetails)
userRouter.get('/getVenderDetails' ,interceptor.adminAuth, controller.getVenderDetails)
userRouter.get('/getIngredientsData' ,interceptor.adminAuth, controller.getIngredientsData)
userRouter.get("/vendor-management",interceptor.adminAuth,controller.vendorDashboard);
userRouter.get("/StockDashboard",interceptor.adminAuth,controller.StockDashboard);
userRouter.get("/fetchAcessDetail/:ID",interceptor.adminAuth,controller.fetchAcessDetail);
userRouter.post("/vendorDateFilter",interceptor.adminAuth,controller.vendorDateFilter);
userRouter.get("/getAllSalesReport",interceptor.adminAuth,controller.getAllSalesReport);
userRouter.get("/GetRestaurantDetail",interceptor.adminAuth,controller.GetRestaurantDetail);
userRouter.get('/getAllOpeningDateFilter' ,interceptor.posAuth, posController.getAllOpeningDateFilter)


/* Accessed employees side */
userRouter.post('/employeeSignInVerification', controller.employeeSignInVerification)
userRouter.post('/sendFeedback', controller.sendFeedback)


userRouter.get('/capDashboard' ,interceptor.capAuth,capController.capDashboard) // Pos dashboard
userRouter.get('/isPassBookReportsAdded',interceptor.posAuth,posController.isPassBookReportsAdded)
userRouter.get('/getUniqueBromagId' ,interceptor.posAuth,posController.getUniqueBromagId) // Pos dashboard
userRouter.get('/posDashboard' ,interceptor.posAuth,posController.posDashboard) // Pos dashboard
userRouter.post('/KotOrders' , interceptor.posAuth,posController.KotOrders)
userRouter.post('/printBill' , interceptor.posAuth,posController.printBill)
userRouter.get('/getMenuDataAtPos' , interceptor.posAuth,posController.getMenuDataAtPos)
userRouter.post('/holdItemsAtPos' , interceptor.posAuth,posController.holdItemsAtPos)


userRouter.get('/takeAwayData' , interceptor.posAuth,posController.takeAwayData)//order records
userRouter.get('/onlineData' , interceptor.posAuth,posController.onlineData)
userRouter.get('/getDineIn' ,interceptor.posAuth, posController.getDineIn)


userRouter.post('/todayExpense' , interceptor.posAuth,posController.todayExpense)// passbook
userRouter.post('/addTodaysExpense' , upload.ImageUploader.single('image'),interceptor.posAuth,posController.addTodaysExpense)
userRouter.post('/addTodaysClosing', upload.ImageUploader.array('image',5), interceptor.posAuth, posController.addTodayClosing)
userRouter.get('/posExpenseData', interceptor.posAuth, posController.posExpenseData)
userRouter.get('/fetchTodaysfloatingCash', interceptor.posAuth, posController.fetchTodaysfloatingCash)
userRouter.get('/getExpenseData', interceptor.posAuth, posController.getexpenseData)
userRouter.get('/getOpeningData' , interceptor.posAuth,posController.getOpeningData)
userRouter.get('/getTodayOpeningData' , interceptor.posAuth,posController.getTodaysOpeningData)
userRouter.get('/getTodayClosingData' , interceptor.posAuth,posController.getTodayClosingData)
userRouter.get('/getClosingData' , interceptor.posAuth,posController.getClosingData)
userRouter.get('/pos/fetchPassbookData' , interceptor.posAuth,posController.fetchPassbookData)
userRouter.post('/passbookDateFilter', interceptor.posAuth, posController.passbookDateFilter)
userRouter.post('/TodaysClosingDateFilter', interceptor.posAuth, posController.TodaysClosingDateFilter)
userRouter.post('/expenseDateFilter', interceptor.posAuth, posController.expenseDateFilter)
userRouter.get('/GetClosingFieldData' , interceptor.posAuth,posController.GetClosingFieldData)




userRouter.get('/getAllRegisteredPos',interceptor.adminAuth,controller.getAllRegisteredPos)

userRouter.post('/addCustomerBillCap' ,upload.ImageUploader.single('image'), interceptor.capAuth,capController.addCustomerBill)

userRouter.post('/addTodaysOpeningBalance' , interceptor.posAuth,posController.addOpeningbalance)


userRouter.get('/getAllcustomerDetails' ,interceptor.posAuth,controller.customerDetails)//customer related
userRouter.get('/getAllcustomerBill' ,interceptor.posAuth,posController.getAllcustomerBill)
userRouter.get('/searchTodaysExpense/:query' ,interceptor.posAuth,posController.searchTodaysExpense)
userRouter.get('/searchTodayClosing/:query' ,interceptor.posAuth,posController.searchTodayClosing)
userRouter.get('/searchTodayOpening/:query' ,interceptor.posAuth,posController.searchTodayOpening)
userRouter.post('/addCustomerBill' ,upload.ImageUploader.single('image'), interceptor.posAuth,posController.addCustomerBill)



userRouter.post('/addLeads' , interceptor.posAuth,posController.addLeads)// leads related at pos
userRouter.get('/getLeadsData' , interceptor.posAuth,posController.getLeadsData)
userRouter.post('/deleteLeadData' , interceptor.posAuth,posController.deleteLeadData)
userRouter.get('/getToEditLead/:leadId' ,interceptor.posAuth ,posController.getToEditLead)
userRouter.post('/updateLeads/:leadId' ,interceptor.posAuth ,posController.updateLeads)
userRouter.post('/takeAwayUserToLead' ,interceptor.posAuth ,posController.takeAwayUserToLead)


// Cap dashboard
userRouter.get('/captainDashboard' ,interceptor.capAuth,capController.captainDashboard)
userRouter.post('/tableBooking' , interceptor.capAuth,capController.tableBooking) 
userRouter.get('/getTableStatus' , interceptor.capAuth,capController.getTableStatus)
userRouter.get('/getMenuDataAtCap' , interceptor.capAuth,capController.getMenuDataAtCap)
userRouter.post('/printBillAtCap' , interceptor.capAuth,capController.printBillAtCap)
userRouter.post('/KotOrdersAtCap' , interceptor.capAuth,capController.KotOrdersAtCap)
userRouter.put('/cancelTable/:tableId' , interceptor.capAuth,capController.cancelTable)
userRouter.get('/TableDetailsByID/:tableId' , interceptor.capAuth,capController.getTableDetails)


userRouter.post('/holdItemsAtCap' , interceptor.capAuth,capController.holdItemsAtCap)
userRouter.get('/getAllcustomerBillForCaptain' ,interceptor.capAuth,capController.getAllcustomerBill)
userRouter.get('/getAllcustomerDetailsCap' ,interceptor.capAuth,controller.customerDetails)


userRouter.get('/getOrderedDataAtCap/:kotId' , interceptor.capAuth,capController.getOrderedDataAtCap)//bill data



userRouter.post('/addLeadsAtCap' , interceptor.capAuth,capController.addLeadsAtCap)// leads related at cap
userRouter.get('/getLeadsDataAtCap' , interceptor.capAuth,capController.getLeadsDataAtCap)
userRouter.post('/deleteLeadDataAtCap' , interceptor.capAuth,capController.deleteLeadDataAtCap)
userRouter.get('/getToEditLeadAtCap/:leadId' ,interceptor.capAuth ,capController.getToEditLeadAtCap)
userRouter.post('/updateLeadsAtCap/:leadId' ,interceptor.capAuth ,capController.updateLeadsAtCap)

module.exports = userRouter;
