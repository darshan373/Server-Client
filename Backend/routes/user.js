const express = require("express");
const router = express.Router();
const QRCode = require('qrcode');
const multer = require('multer');
const auth=require("../middleware/auth")
const path = require('path');
const { handleSignup,handleSignin, get_profile,update_profile,update_password,handleLogout } = require("../controllers/user"); 
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


router.post("/signup", handleSignup); 
router.post("/signin", handleSignin);
router.post("/get-profile",auth,get_profile)
router.post("/update-profile", auth,upload.single('profileImage'), update_profile);
router.post("/update-password",update_password)
router.post("/logout",auth,handleLogout)
module.exports = router;
