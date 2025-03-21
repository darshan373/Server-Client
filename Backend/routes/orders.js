const express = require("express");
const {create_orders,edit_orders,all_orders,get_orders,get_pdf}=require("../controllers/orders")
const auth=require("../middleware/auth")
const multer=require("multer")
const router = express.Router();
const storage = multer.diskStorage({
     destination: (req, file, cb) => {
          cb(null, 'uploads/'); // Destination folder
        },
        filename: (req, file, cb) => {
          console.log(file)
          cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
        },
});

const upload = multer({ storage });
router.post("/create-order",auth,create_orders)
router.post("/edit-order",auth,edit_orders)
router.post("/all-orders",auth,all_orders)
router.post("/get-order",get_orders)
router.post("/get-pdf",upload.single("file"),get_pdf)
module.exports=router