const con = require("../Model/connection");

// const addproducts = async (req, res) => {
//   const { user_id, product_name, description, price, length, width, volume } =
//     JSON.parse(req.body.payload);
//   let file = req.file ? `${req.file.filename}` : null;
//   console.log(req.body.payload);
//   console.log(req.file)
//   let fileid = null;
//   try {
//     con.beginTransaction((err) => {
//       if (err) {
//         throw err;
//       }
//       if (file) {
//         const filesql = `INSERT INTO mm (id,mm_file) values(?)`;

//         con.query(filesql, [file], (err, result) => {
//           if (err) {
//             return con.rollback(() => {
//               res.status(500).send({ message: err, status: 0 });
//             });
//           }
//           fileid = result.insertId;
//         });
//       }

//       // Insert product data into the products table
//       const sql = `INSERT INTO products (user_id, product_name, description, price,mmid) VALUES (?, ?, ?, ?,?)`;

//       con.query(
//         sql,
//         [user_id, product_name, description, price, fileid],
//         (err, result) => {
//           if (err) {
//             console.error("Error inserting data into products table: ", err);
//             return con.rollback(() => {
//               res.status(500).send({ message: err, status: 0 });
//             });
//           }
// console.log(result)
//           const product_id = result.insertId;

//           // Insert dimensions data into the product_dimensions table
//           const sql2 = `INSERT INTO product_lookup (product_id, length, width, volume) VALUES (?, ?, ?, ?)`;

//           con.query(
//             sql2,
//             [product_id, length, width, volume],
//             (err, result) => {
//               if (err) {
//                 console.error(
//                   "Error inserting data into product_dimensions table: ",
//                   err
//                 );
//                 return con.rollback(() => {
//                   res.status(500).send({
//                     message: "Error adding product dimensions",
//                     status: 0,
//                   });
//                 });
//               }

//               // Commit the transaction after successful insertion in both tables
//               con.commit((err) => {
//                 if (err) {
//                   return con.rollback(() => {
//                     res.status(500).send({
//                       message: "Error committing transaction",
//                       status: 0,
//                     });
//                   });
//                 }

//                 // Send success response
//                 res.status(201).json({
//                   MESSAGE: "Product added successfully",
//                   PRODUCT_ID: product_id,
//                   STATUS: 1,
//                   USER_ID: user_id,
//                 });
//               });
//             }
//           );
//         }
//       );
//     });
//   } catch (err) {
//     console.error("Error handling product insertion: ", err);
//     res.status(500).send("Internal server error");
//   }
// };

const addproducts = async (req, res) => {
  const {product_name, description, price, length, width, volume } =
    JSON.parse(req.body.payload);
    const user_id=req.user_id;
  let file = req.file ? `${req.file.filename}` : null;
  let fileid = null;

  console.log(req.body.payload);

  try {
    // Start transaction
    await new Promise((resolve, reject) => {
      con.beginTransaction((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Handle file insert if a file exists
    if (file) {
      const filesql = `INSERT INTO mm (mm_file) VALUES (?)`;

      fileid = await new Promise((resolve, reject) => {
        con.query(filesql, [file], (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        });
      });
    }

    // Insert product data
    const sql = `INSERT INTO products (user_id, product_name, description, price, mmid) VALUES (?, ?, ?, ?, ?)`;
    const productResult = await new Promise((resolve, reject) => {
      con.query(
        sql,
        [user_id, product_name, description, price, fileid],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    const product_id = productResult.insertId;

    // Insert product dimensions (ensure product_id exists)
    const sql2 = `INSERT INTO product_lookup (product_id, length, width, volume) VALUES (?, ?, ?, ?)`;
    await new Promise((resolve, reject) => {
      con.query(sql2, [product_id, length, width, volume], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Commit the transaction after all queries are successful
    await new Promise((resolve, reject) => {
      con.commit((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Send success response
    res.status(201).json({
      MESSAGE: "Product added successfully",
      PRODUCT_ID: product_id,
      STATUS: 1,
      USER_ID: user_id,
    });
  } catch (err) {
    console.error("Error handling product insertion: ", err);

    // Rollback if any error occurs
    await new Promise((resolve, reject) => {
      con.rollback(() => {
        reject("Transaction rolled back");
      });
    });

    // Check for headers sent error and avoid sending multiple responses
    if (!res.headersSent) {
      res.status(500).send("Internal server error");
    }
  }
};

const editproducts = async (req, res) => {
  const {
    product_id,
    user_id,
    product_name,
    description,
    price,
    length,
    width,
    volume,
  } = JSON.parse(req.body.payload);
  const file = req.file ? req.file.filename : null;

  try {
    con.beginTransaction((err) => {
      if (err) throw err;

      // Function to update product details with or without mm_id
      const updateProduct = (mm_id) => {
        let sql = "";
        let query = [];
        if (mm_id) {
          sql = `UPDATE products SET product_name = ?, description = ?, price = ?, mmid = ? WHERE product_id = ?`;
          query = [product_name, description, price, mm_id, product_id];
        } else {
          sql = `UPDATE products SET product_name = ?, description = ?, price = ? WHERE product_id = ?`;
          query = [product_name, description, price, product_id];
        }
        //const sql = `UPDATE products SET product_name = ?, description = ?, price = ?, mmid = ? WHERE product_id = ?`;
        con.query(sql, query, (err, result) => {
          if (err) {
            console.error("Error updating data in products table: ", err);
            return con.rollback(() => {
              res.status(500).send({ message: err, STATUS: 0 });
            });
          }

          // Update dimensions data in the product_lookup table
          const sql2 = `UPDATE product_lookup SET length = ?, width = ?, volume = ? WHERE product_id = ?`;
          con.query(
            sql2,
            [length, width, volume, product_id],
            (err, result) => {
              if (err) {
                console.error(
                  "Error updating data in product_lookup table: ",
                  err
                );
                return con.rollback(() => {
                  res
                    .status(500)
                    .send({
                      message: "Error updating product dimensions",
                      STATUS: 0,
                    });
                });
              }

              // Commit the transaction after successful updates in all tables
              con.commit((err) => {
                if (err) {
                  return con.rollback(() => {
                    res
                      .status(500)
                      .send({
                        message: "Error committing transaction",
                        STATUS: 0,
                      });
                  });
                }

                // Send success response
                res.status(200).json({
                  MESSAGE: "Product updated successfully",
                  PRODUCT_ID: product_id,
                  STATUS: 1,
                  USER_ID: user_id,
                });
              });
            }
          );
        });
      };

      // If a file is provided, insert it into the mm table and get mm_id
      if (file) {
        const filesql = `INSERT INTO mm (mm_file) VALUES (?)`;
        con.query(filesql, [file], (err, result) => {
          if (err) {
            console.error("Error inserting image into mm table: ", err);
            return con.rollback(() => {
              res
                .status(500)
                .send({ message: "Error uploading image", STATUS: 0 });
            });
          }
          const mm_id = result.insertId; // Get the mm_id of the uploaded image
          updateProduct(mm_id); // Update product with mm_id
        });
      } else {
        // If no file is provided, proceed to update the product without mm_id
        updateProduct(null);
      }
    });
  } catch (err) {
    console.error("Error handling product update: ", err);
    res.status(500).send("Internal server error");
  }
};

const allproducts = async (req, res) => {
  const { search_keyword,item_per_page, current_page } = req.body;
  const user_id=req.user_id;
  let offset = 0;
  let limit = 10;

  if (item_per_page) {
    limit = item_per_page;
  }
  if (current_page) {
    offset = (current_page - 1) * item_per_page;
  }
  const search_keyword1 = search_keyword || "";
  console.log(req.body);

  try {
    const sql = `
        SELECT * 
        FROM products AS p
        JOIN product_lookup AS pl ON p.product_id = pl.product_id
        LEFT JOIN mm AS m ON p.mmid = m.id
        WHERE p.user_id = ${user_id}
        AND (p.product_name LIKE "%${search_keyword1}%" OR p.description LIKE "%${search_keyword1}%")
        LIMIT ${limit} OFFSET ${offset}
    `;

    const countsql = `
        SELECT count(*) as TOTAL_PRODUCTS
        FROM products AS p
        JOIN product_lookup AS pl ON p.product_id = pl.product_id
        LEFT JOIN mm AS m ON p.mmid = m.id
        WHERE p.user_id = ${user_id}
    `;

    // Fetch product list
    con.query(sql, [], (err, result) => {
      if (err) {
        console.error("Error querying data from MySQL: ", err);
        return res.status(500).send("Error retrieving products");
      }

      // Fetch total products count
      con.query(countsql, [], (err, countResult) => {
        if (err) {
          console.error("Error querying count from MySQL: ", err);
          return res.status(500).send("Error retrieving product count");
        }

        const TOTAL_PRODUCTS = countResult[0]?.TOTAL_PRODUCTS || 0;

        if (result.length > 0) {
          res.status(200).json({
            DATA: {
              PRODUCT_LIST: result,
              TOTAL_PRODUCTS: TOTAL_PRODUCTS,
            },
            MESSAGE: "Products Fetched Successfully",
            STATUS: 1,
          });
        } else {
          res.status(200).json({
            MESSAGE: "No products found",
            STATUS: 0,
          });
        }
      });
    });
  } catch (err) {
    console.error("Error in processing request: ", err);
    res.status(500).send("Internal server error");
  }
};


const getproduct = async (req, res) => {
  const { product_id } = req.body;

  console.log(req.body);
  try {
    let sql = `
        SELECT * 
        FROM products AS p 
        JOIN product_lookup AS pl ON p.product_id = pl.product_id 
        LEFT JOIN mm as m on m.id=p.mmid
        WHERE p.product_id = ${product_id}`;

    con.query(
      sql,
      [], // Pass user_id if it exists
      (err, result) => {
        if (err) {
          console.error("Error querying data from MySQL: ", err);
          return res.status(201).send("Error retrieving products");
        }

        // Create JWT token
        //const token = jwt.sign({ user_id }, jwtSecret, { expiresIn: "1h" });

        // Send success response with the result
        if (result.length > 0) {
          res.status(201).json({
            DATA: { PRODUCT_LIST: result },
            MESSAGE: "Products Details Fetched Successfullyy",
            STATUS: 1,
          });
        } else {
          res.status(201).json({
            MESSAGE: "No products found",
            STATUS: 0,
          });
        }
      }
    );
  } catch (err) {
    console.error("Error in processing request: ", err);
    res.status(500).send("Internal server error");
  }
};
const listproducts = async (req, res) => {
  const user_id=req.user_id;
  const { search_keyword, item_per_page, current_page } = req.body;
  let offset = 0;
  let limit = 10;

  if (item_per_page) {
    limit = item_per_page;
  }
  if (current_page) {
    offset = (current_page - 1) * item_per_page;
  }
  console.log(search_keyword);
  const key = search_keyword || "";
  try {
    let sql = `
        SELECT p.product_name as PRODUCT_NAME,p.product_id as PRODUCT_ID,p.price as PRICE 
        FROM products AS p 
        JOIN product_lookup AS pl ON p.product_id = pl.product_id
        WHERE p.product_name like "%${search_keyword}%" and p.user_id!=${user_id}   LIMIT ${limit} OFFSET ${offset}`;
    console.log(sql);

    con.query(
      sql,
      [], // Pass user_id if it exists
      (err, result) => {
        if (err) {
          console.error("Error querying data from MySQL: ", err);
          return res.status(201).send("Error retrieving products");
        }

        // Create JWT token
        //const token = jwt.sign({ user_id }, jwtSecret, { expiresIn: "1h" });

        // Send success response with the result
        if (result.length > 0) {
          res.status(201).json({
            DATA: { PRODUCT_LIST: result },
            MESSAGE: "Products Details Fetched Successfullyy",
            STATUS: 1,
          });
        } else {
          res.status(201).json({
            MESSAGE: "No products found",
            STATUS: 0,
          });
        }
      }
    );
  } catch (err) {
    console.error("Error in processing request: ", err);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  addproducts,
  editproducts,
  allproducts,
  getproduct,
  listproducts,
};
