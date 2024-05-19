const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const dotenv=require("dotenv");
// dotenv.config();

cloudinary.config({
  cloud_name: "dg4iksxsb",
  api_key: "662864161778669",
  api_secret: "hkBWkNQVj9w68yTq53WG-_i2dS0",
});
//console.log(process.env.CLOUDINARY_CLOUD_NAME);
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mlmodelpredict",
    allowedFormats: ["jpeg", "png", "jpg", "webp"],
  }
});

module.exports = {
  cloudinary,
  storage,
};