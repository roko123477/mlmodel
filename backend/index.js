const express = require("express");
const app = express();
const mongoose = require("mongoose");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { storage, cloudinary } = require("./cloudinary");
const uploadMiddleware = multer({ storage });
//const fileUpload = require("express-fileupload");
const ejsMate = require("ejs-mate");
const path = require("path");
const cors = require("cors");
var request = require('request-promise'); 
const db_url =
  "mongodb+srv://rohitkoner5:roko@cluster0.2uqgbqg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.set("strictQuery", true);
mongoose
  .connect(db_url)
  .then(() => console.log("database connected"))
  .catch((err) => console.log(err));

app.use(cookieParser());
app.engine("ejs", ejsMate);

// setup EJS
app.set("view engine", "ejs");

// directories
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.set("views", path.join(__dirname, "views"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.json({ limit: "50mb" }));

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.get("/", (req, res) => {
  res.json("server running");
});

// async function loadModel() {
//   const model = await tf.loadLayersModel("file://path/to/your/model.h5");
//   // Now the model is loaded with the weights from the .h5 file
//   return model;
// }
app.post(
  "/senddata",
  uploadMiddleware.array("photos", 100),
  async (req, res) => {
    let imageFiles = req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));

    var options = {
      method: "POST",
      uri: "http://127.0.0.1:8000/predict",
      body: imageFiles,
      json: true, // Automatically stringifies the body to JSON
    };
    var returndata;
    var sendrequest = await request(options)
      .then(function (parsedBody) {
        returndata = parsedBody; // do something with this data, here I'm assigning it to a variable.
      })
      .catch(function (err) {
        console.log(err);
      });

    res.status(200).json(returndata);
  }
);

app.listen(3000, () => {
  console.log("listening on port 3000");
});
