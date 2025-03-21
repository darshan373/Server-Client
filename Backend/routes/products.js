const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth=require("../middleware/auth")
const {addproducts,editproducts,allproducts,getproduct,listproducts}=require("../controllers/product")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Destination folder
    },
    filename: (req, file, cb) => {
      console.log(file)
      cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    },
  });
  const upload = multer({ storage: storage });
router.post("/add-product",auth,upload.single('file'),addproducts)
router.post("/edit-product",auth,upload.single('file'),editproducts)
router.post("/all-products",auth,allproducts)
router.post("/get-product",auth,getproduct)
router.post("/list-product",auth,listproducts)
module.exports=router;