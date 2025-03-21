const express = require("express");
const  nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const con=require("./Model/connection")
const QRCode=require("qrcode")
const qs=require("qs")
const fs=require("fs")
const morgan=require("morgan")
const helmet=require("helmet")
app.use(express.urlencoded({
  extended: true
  }));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
const userRouter=require("./routes/user")
const productRouter=require("./routes/products")
const orderRouter=require("./routes/orders")
require('dotenv').config();
const cors = require('cors');

//app.use(cors());
app.use(
  cors({
    origin: 'http://localhost:3002', // Replace with your frontend URL
    credentials: true, // Allow sending cookies
  })
);
app.use(cookieParser());
const accessLogStream = fs.createWriteStream(
  path.join("./Logs", "access.log"),
  { flags: "a" } 
);
app.use(morgan("combined", { stream: accessLogStream }));
app.use(helmet({
  crossOriginResourcePolicy:false
}))
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT=process.env.PORT
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to SQL DB");
});

app.use("/",userRouter)
app.use("/products",productRouter)
app.use("/orders",orderRouter)

app.get('/generateQR', async (req, res) => {
  try {
    const {url} = req.body || 'https://example.com';
    const qrCodeImage = await QRCode.toDataURL(url);
    res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).send('Internal Server Error');
  }
});



// CRUD OPERATIONS IN MYSQL

//create operations api

app.post("/create",(req,res)=>{
  console.log(req.body)
  const {name,email,number}=req.body;
  try {
    const sql=`INSERT INTO sampledata (name,email,number) VALUES('${name}','${email}','${number}')`
    con.query(sql,[],(err,result)=>{
      if(err) throw err;
        res.json({
          result:result,
      Message:"data inserted"})
    })
  } catch (error) {
    console.log(error)
    return res.send(error)
  }
 
})
app.post("/delete",(req,res)=>{
  console.log(req.body)
  const {id}=req.body;
  try {
    const sql=`DELETE FROM sampledata WHERE id=${id}`
    con.query(sql,[],(err,result)=>{
      if(err) throw err;
        res.json({
          result:result,
      Message:"data deleted"})  
    })
  } catch (error) {
    console.log(error)
    return res.send(error)
  }
 
})


app.post("/update",(req,res)=>{
  console.log(req.body)
  const {name,email,number,id}=req.body;
  try {
    const sql=`UPDATE sampledata SET name='${name}',email='${email}',number='${number}' WHERE id=${id}`
    con.query(sql,[],(err,result)=>{
      if(err) throw err;
        res.json({
          result:result,
      Message:"data modified"})  
    })
  } catch (error) {
    console.log(error)
    return res.send(error)
  }
 
})

app.post("/get",(req,res)=>{
const {id}=req.body;
  try {
    const sql=`SELECT id as ID,name as NAME,email as EMAIL,number as PHONE_NUMBER FROM sampledata WHERE id=${id}`
    con.query(sql,[],(err,result)=>{
      if(err) throw err;
        res.json({
          DATA:result,
      Message:"data successfully fetched"})  
    })
  } catch (error) {
    console.log(error)
    return res.send(error)
  }
 
})
app.listen(PORT, (req,res) => {
console.log(`Server is running on port ${PORT}`);
});

