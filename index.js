const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require('path')
const cron = require('./utils/cron.js')

dotenv.config();

const app = express();

mongoose
  .connect(process.env.MONGODB)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")))

// CORS setup

app.use(cors());
// app.use(
//   cors({
//     origin: process.env.CLIENT,
//     methods: ["GET", "POST","PUT"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Access", "Authorization"],
//   })
// );


// Routers
const User = require("./router/user");
app.use("/", User);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

cron // cron integration