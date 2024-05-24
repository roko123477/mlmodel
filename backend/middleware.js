const jwtSecret = "sdffgdfgdfgdfgrty12^%";
const jwt = require("jsonwebtoken");
const isLoggedIn=(req, res, next) => {
    // console.log("req user:",req.user);
    const { token } = req.cookies;
  // console.log(token);
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) res.redirect("http://localhost:3000/login");
    });
  } else {
    res.redirect("http://localhost:3000/login");
  }
    
     next();
 }
 module.exports = { isLoggedIn }