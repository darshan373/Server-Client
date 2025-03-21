const con = require("../Model/connection");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const multer=require("multer")
const create_orders = async (req, res) => {
  const {
    product_id,
  
    total_orders,
    amount_paid,
    amount_due,
    total_amount,
  } = req.body;
  const user_id=req.user_id;

  try {
    // Check if all necessary fields are provided
    if (
      !product_id ||
      !user_id ||
      !total_orders ||
      !amount_paid ||
      !total_amount ||
      !amount_due
    ) {
      return res.status(201).json({
        MESSAGE: "Missing required fields",
        STATUS: 0,
      });
    }

    // Query to get the product price from the database
    const pricesql = `SELECT price FROM products WHERE product_id = ?`;

    con.query(pricesql, [product_id], (err, result) => {
      if (err) {
        console.error("Error fetching product price: ", err);
        return res.status(201).json({
          MESSAGE: "Error fetching product price",
          STATUS: 0,
        });
      }

      if (result.length === 0) {
        return res.status(201).json({
          MESSAGE: "Product not found",
          STATUS: 0,
        });
      }

      const product_price = result[0].price;

      // Now that we have the product price, we can insert the order into the orders table
      const orderSql = `
        INSERT INTO orders (product_id, user_id, total_orders, amount_paid, amount_due, total_amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      con.query(
        orderSql,
        [
          product_id,
          user_id,
          total_orders,
          amount_paid,
          amount_due,
          total_amount,
        ],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error inserting order: ", insertErr);
            return res.status(500).json({
              MESSAGE: "Error creating order",
              STATUS: 0,
            });
          }

          // Successfully created the order
          res.status(201).json({
            MESSAGE: "Order created successfully",
            STATUS: 1,
            order_id: insertResult.insertId,
          });
        }
      );
    });
  } catch (err) {
    console.error("Error handling order creation: ", err);
    res.status(500).send("Internal server error");
  }
};

const edit_orders = async (req, res) => {
  const { order_id, total_orders, amount_paid, amount_due, total_amount } =
    req.body;



  try {
    // Check if the order_id exists
    const checkOrderSql = `SELECT * FROM orders WHERE order_id = ?`;
    con.query(checkOrderSql, [order_id], (err, result) => {
      if (err) {
        console.error("Error checking order existence: ", err);
        return res.status(500).send({ message: err, STATUS: 0 });
      }

      // If no matching order_id found, return error response
      if (result.length === 0) {
        return res.status(404).json({ MESSAGE: "Order not found", STATUS: 0 });
      }

      // If order_id exists, proceed with updating the order
      const updateSql = `UPDATE orders SET total_orders = ?, amount_paid = ?, amount_due = ?,total_amount = ? WHERE order_id = ?`;
      con.query(
        updateSql,
        [total_orders, amount_paid, amount_due, total_amount, order_id],
        (err, result) => {
          if (err) {
            console.error("Error updating data in orders table: ", err);
            return res.status(500).send({ message: err, STATUS: 0 });
          }

          // Send success response
          res.status(200).json({
            MESSAGE: "Order updated successfully",
            ORDER_ID: order_id,
            STATUS: 1,
          });
        }
      );
    });
  } catch (err) {
    console.error("Error handling order update: ", err);
    res.status(500).send("Internal server error");
  }
};

const all_orders = async (req, res) => {
  const {item_per_page, current_page } = req.body;

  const user_id=req.user_id;
  let offset = 0;
  let limit = 10;

  if (item_per_page) {
    limit = item_per_page;
  }
  if (current_page) {
    offset = (current_page - 1) * item_per_page;
  }

  try {
    // Check if the order_id exists
    const checkUserSql = `SELECT * FROM users WHERE id = ?`;
    con.query(checkUserSql, [user_id], (err, result) => {
      if (err) {
        console.error("Error checking order existence: ", err);
        return res.status(201).send({ message: err, STATUS: 0 });
      }

      // If no matching order_id found, return error response
      if (result.length === 0) {
        return res.status(201).json({ MESSAGE: "User not found", STATUS: 0 });
      }
      let count = 0;
      const countersql = `
      SELECT 
        count(*) as total 
      FROM 
        users AS u 
      JOIN 
        orders AS o 
        ON o.user_id = u.id 
      JOIN 
        products AS p 
        ON p.product_id = o.product_id 
      JOIN 
        product_lookup AS pl 
        ON pl.product_id = p.product_id 
      WHERE 
        u.id = ${user_id}
   ;
    `;

      // If order_id exists, proceed with updating the order
      const allorderSql = `SELECT u.id as USER_ID,u.email as EMAIL,u.first_name as NAME,p.product_id as PRODUCT_ID,p.product_name as PRODUCT_NAME,p.description as DESCRIPTION,p.price as PRODUCT_PRICE,o.order_id as ORDER_ID,o.total_orders as TOTAL_ORDERS,o.total_amount as COST,o.amount_due as DUE,o.amount_paid as PAID,pl.length as PRODUCT_LENGTH,pl.width as PRODUCT_WIDTH,pl.volume as PRODUCT_VOLUME , m.mm_file as file from users as u join orders as o on o.user_id=u.id join products as p on p.product_id=o.product_id join product_lookup as pl on pl.product_id=p.product_id left join mm as m on m.id=p.mmid WHERE u.id=${user_id} LIMIT ${limit} OFFSET ${offset};`;
      con.query(allorderSql, [], (err, result1) => {
        if (err) {
          console.error("Error updating data in orders table: ", err);
          return res.status(500).send({ message: err, STATUS: 0 });
        }
        
      con.query(countersql, [], (err, result) => {
        if (err) {
          console.error("Error counting data in orders table: ", err);
          return res.status(500).send({ message: err, STATUS: 0 });
        }
        count = result[0].total;
        console.log(count);
        res.status(200).json({
          MESSAGE: "Order Details successfully fetched",
          DATA: {
            ORDERS_LIST: result1,
            TOTAL_ORDER: count,
          },
          STATUS: 1,
        });
      });

        // Send success response
   
      });
    });
  } catch (err) {
    console.error("Error handling order update: ", err);
    res.status(500).send("Internal server error");
  }
};
const get_orders = async (req, res) => {
  const { order_id } = req.body;
  console.log(req.body);

  try {
    // Check if the order_id exists
    const checkOrderSql = `SELECT * FROM orders WHERE order_id = ?`;
    con.query(checkOrderSql, [order_id], (err, result) => {
      if (err) {
        console.error("Error checking order existence: ", err);
        return res.status(201).send({ message: err, STATUS: 0 });
      }

      // If no matching order_id found, return error response
      if (result.length === 0) {
        return res.status(201).json({ MESSAGE: "Order not found", STATUS: 0 });
      }

      // If order_id exists, proceed with updating the order
      const allorderSql = `SELECT p.product_id as PRODUCT_ID,p.product_name as PRODUCT_NAME,p.price as PRODUCT_PRICE,o.order_id as ORDER_ID,o.total_orders as TOTAL_ORDERS,o.total_amount as COST,o.amount_due as DUE,o.amount_paid as PAID from orders as o join products as p on p.product_id=o.product_id WHERE o.order_id=${order_id} ;`;
      con.query(allorderSql, [], (err, result) => {
        if (err) {
          console.error("Error updating data in orders table: ", err);
          return res.status(500).send({ message: err, STATUS: 0 });
        }

        // Send success response
        res.status(200).json({
          MESSAGE: "Order Details successfully fetched",
          DATA: {
            ORDERS_LIST: result[0],
          },
          STATUS: 1,
        });
      });
    });
  } catch (err) {
    console.error("Error handling order update: ", err);
    res.status(500).json("Internal server error");
  }
};
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `uploaded_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage });
const get_pdf=async(req,res)=>{
  try {
    // If a file is uploaded, return its relative path
    if (req.file) {
        return res.status(200).json({
            message: "File uploaded successfully",
            pdfPath: `uploads/pdf/${req.file.filename}`
        });
    }

    // If no file is uploaded, generate a PDF
    const content = {
      order_id:1,
      product_name:"bat"
      ,price:46,
      
    }
    if (!content) {
        return res.status(400).json({ error: "Content is required" });
    }

    const fileName = `${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const relativePath = `uploads/${fileName}`;

    // Create PDF
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    doc.fontSize(14).text("darshan", { align: "center" });
    doc.end();

    writeStream.on("finish", () => {
        res.status(200).json({
            message: "PDF generated successfully",
            pdfPath: relativePath
        });
    });

    writeStream.on("error", (err) => {
        console.error("Error writing PDF:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
    });

} catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
}

module.exports = { create_orders, edit_orders, all_orders, get_orders ,get_pdf};
