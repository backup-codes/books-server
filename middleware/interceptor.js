const jwt = require("jsonwebtoken");

const employeeAuth = async (req, res, next) => {
  try {
    const tokenWithBearer = req.headers["authorization"];
    if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header missing or invalid",
        success: false,
      });
    }
    const token = tokenWithBearer.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, encoded) => {
      if (err) {
        return res.status(401).json({ message: "Auth failed", success: false });
      } else {
        req.id = encoded.id;
        req.role = encoded.role;
        req.restaurant = encoded.restaurant;
        next();
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const tokenWithBearer = req.headers["authorization"];

    if (tokenWithBearer) {
      const Token = tokenWithBearer.replace(/"/g, "");

      const verifyToken = jwt.verify(Token, process.env.SECRET_KEY);
      console.log(Token,"I am token");
      if (verifyToken.role == "owner") {
        req.id = verifyToken.id;
        req.role = "owner";
        req.restaurant = verifyToken.restaurant;
        next();
      } else {
        res.status(401).json({ success: false,message:"Access Denied" });
      }
    } else {
      res.status(401).json({ success: false,message:"Access Denied" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const posAuth = async (req, res, next) => {
  try {
    const tokenWithBearer = req.headers["authorization"];
    if (tokenWithBearer) {
      const Token = tokenWithBearer.replace(/"/g, "");

      const verifyToken = jwt.verify(Token, process.env.SECRET_KEY);
      if (verifyToken.role == "pos") {
        req.id = verifyToken.id;
        req.role = "pos";
        req.restaurant = verifyToken.restaurant;
        next();
      } else {
        res.json({ success: false });
      }
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const capAuth = async (req, res, next) => {
  try {
    const tokenWithBearer = req.headers["authorization"];
    if (tokenWithBearer) {
      const Token = tokenWithBearer.replace(/"/g, "");

      const verifyToken = jwt.verify(Token, process.env.SECRET_KEY);
      if (verifyToken.role == "cap") {
        req.id = verifyToken.id;
        req.role = "cap";
        req.restaurant = verifyToken.restaurant;
        next();
      } else {
        res.json({ success: false });
      }
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

module.exports = {
  adminAuth,
  employeeAuth,
  posAuth,
  capAuth,
};
