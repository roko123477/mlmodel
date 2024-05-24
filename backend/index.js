const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { storage, cloudinary } = require("./cloudinary");
const uploadMiddleware = multer({ storage });
const { isLoggedIn }=require("./middleware");
//const fileUpload = require("express-fileupload");
const Store = require("./models/store");
const User = require("./models/User");
const path = require("path");
const cors = require("cors");
const Jimp = require("jimp");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(12);
const jwtSecret = "sdffgdfgdfgdfgrty12^%";
const jwt = require("jsonwebtoken");
var request = require("request-promise");
const db_url =
  "";
mongoose.set("strictQuery", true);
mongoose
  .connect(db_url)
  .then(() => console.log("database connected"))
  .catch((err) => console.log(err));

// directories
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.json({ limit: "50mb" }));

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.json("server running");
});

app.post(
  "/senddata",isLoggedIn,
  uploadMiddleware.array("photos", 100),
  async (req, res) => {
    // console.log(req.files);
    var imageFiles = req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));
    // this is done for local cached data stored already predicted for same image
    const images = await Store.find({});
    let flag = 0;
    let pred_class = "";
    let user_image = "";
    let prediction = [];
    // console.log(images)
    for (img of images) {
      // console.log(img.imageurl)
      const exm1 = await Jimp.read({
        url: imageFiles[0].url, // Required!
      });
      const exm2 = await Jimp.read({
        url: img.user_image, // Required!
      });
      const exm1hash = exm1.hash();
      const exm2hash = exm2.hash();

      const dist = Jimp.distance(exm1, exm2);
      const diff = Jimp.diff(exm1, exm2);

      if (exm1hash != exm2hash || dist > 0.15 || diff > 0.15) {
        // console.log("dont match images with the cached database");
      } else {
        flag = 1;
        pred_class = img.pred_class;
        user_image = img.user_image;
        prediction = img.prediction;
        break;
      }
    }
    //if same images are passed and already found in local cache
    if (flag === 1) {
      return res.status(200).json({ user_image, prediction, pred_class });
    }
    // sending the req to flask server to get model value predicted
    else {
      var options = {
        method: "POST",
        uri: "http://127.0.0.1:8000/predict",
        body: imageFiles,
        json: true, // Automatically stringifies the body to JSON
      };
      var returndata;
      var sendrequest = await request(options)
        .then(function (parsedBody) {
          returndata = parsedBody;
          // do something with this data, here I'm assigning it to a variable.
        })
        .catch(function (err) {
          console.log(err);
        });
      // console.log(imageFiles[0].url)
      const data = await Store.create({
        user_image: imageFiles[0].url,
        imagefilename: imageFiles[0].filename,
        pred_class: returndata.pred_class,
        prediction: returndata.prediction[0],
      });
      // console.log(returndata.prediction[0]);

      return res.status(200).json(returndata);
    }
  }
);

//
app.post("/register", async (req, res) => {
  const { firstname, lastname, email, phone, password, file } = req.body;
  try {
    const createdUser = await User.create({
      firstname,
      lastname,
      file,
      email,
      phonenumber: phone,
      password: bcrypt.hashSync(password, salt),
    });
    res.status(200).json(createdUser);
  } catch (error) {
    res.json({ error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userDoc = await User.findOne({ email });

    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign(
          { name: userDoc.firstname, email: userDoc.email, id: userDoc._id },
          jwtSecret,
          {},
          (err, token) => {
            if (err) {
              throw err;
            }
            res
              .cookie("token", token, { sameSite: "none", secure: true })
              .json(userDoc);
          }
        );
      } else {
        res.status(422).json("pass not ok");
      }
    } else {
      res.status(400).json("not found");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  // console.log(token);
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;
      const { firstname, email, _id } = await User.findById(user.id);
      res.status(200).json({ name: firstname, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "", { sameSite: "none", secure: true }).json(true);
});

app.get("/getuserdetails/:id",isLoggedIn, async (req, res) => {
  const { id } = req.params;

  try {
    //console.log(id);
    const user = await User.findOne({ _id: id });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error });
  }
});

app.listen(5000, () => {
  console.log("listening on port 5000");
});
