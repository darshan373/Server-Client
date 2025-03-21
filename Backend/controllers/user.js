const bcrypt = require("bcrypt");
const con = require("../Model/connection");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const handleSignup = async (req, res) => {
  const { email, password, first_name, last_name, address } = req.body;
  console.log(req.body);

  try {
    // Check if the user already exists
    const sql = "SELECT * FROM users WHERE email = ?";
    con.query(sql, [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Database error", status: 0, data: [] });
      }

      if (result.length > 0) {
        return res
          .status(201)
          .json({ message: "User already exists", status: 0, data: [] });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert the new user into the database
      const insertSql =
        "INSERT INTO users (email, password, first_name, last_name,address) VALUES (?, ?, ?, ?,?)";
      con.query(
        insertSql,
        [email, hashedPassword, first_name, last_name, address],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error creating user" });
          }

          // Generate a JWT token
          const userId = result.insertId;

          // Respond with success and the JWT token
          res.status(201).json({
            message: "User created successfully",

            ID: userId,
            first_name: first_name,
            status: 1,
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
};
const handleSignin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body, "Called");

  try {
    // Check if the user exists
    const sql = "SELECT * FROM users WHERE email = ?";
    con.query(sql, [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Database error", status: 0, data: [] });
      }
      console.log("RESULT", result);
      if (result.length === 0) {
        // User does not exist
        return res
          .status(200)
          .json({ message: "Email ID doesn't exist ", status: 0, data: [] });
        0;
      }  
      console.log(result)
      const user=result[0]

      const sql1 = `UPDATE users SET last_login=NOW() WHERE id=?`;
      con.query(sql1, [user.id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Database error" });
        }
        console.log(result)
        
      });

      // Compare the provided password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(200)
          .json({ message: "Invalid email or password", status: 0, data: [] });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "5h",
      });
      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      res.cookie("accessToken", token, cookiesOption);

      // Respond with success and the JWT token
      res.status(200).json({
        message: "User signed in successfully",
        token: token,
        ID: user.id,
        status: 1,
        data: result,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing in" });
  }
};

const get_profile = async (req, res) => {
  const user_id = req.user_id;
  console.log(req.user_id);

  try {
    // Check if the user exists
    const sql = "SELECT * FROM users WHERE id = ?";
    con.query(sql, [user_id], async (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Database error", status: 0, data: [] });
      }
      console.log("RESULT", result);
      if (result.length === 0) {
        // User does not exist
        return res
          .status(200)
          .json({ message: "User doesn't exist ", status: 0, data: [] });
      }

      const user = result[0];

      // Respond with success and the JWT token
      res.status(200).json({
        message: "User Details",
        ID: user.id,
        status: 1,
        data: result[0],
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing in" });
  }
};
const update_profile = async (req, res) => {
  const { email, first_name, last_name, address } = JSON.parse(
    req.body.payload
  );
  const id = req.user_id;

  try {
    // Check if the user exists
    const selectSql = "SELECT * FROM users WHERE id = ?";
    con.query(selectSql, [id], (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Database error", status: 0, data: [] });
      }

      if (result.length === 0) {
        // User does not exist
        return res
          .status(201)
          .json({ message: "User doesn't exist", status: 0, data: [] });
      }
      let profileImagePath = req.file ? `${req.file.filename}` : null;
      // Update user details
      if (profileImagePath) {
        const updateSql =
          "UPDATE users SET  address = ?, first_name = ?, last_name = ?,image= ? WHERE id = ?";
        const updateparams = [
          address,
          first_name,
          last_name,
          profileImagePath,
          id,
        ];
        con.query(updateSql, updateparams, (err, updateResult) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({ message: "Error updating user", status: 0, data: [] });
          }

          // Respond with success and updated user data
          res.status(200).json({
            message: "User details updated successfully1",
            status: 1,
            data: {
              user_id: id,
              file_name: profileImagePath,
            },
          });
        });
      } else {
        const updateSql =
          "UPDATE users SET address = ?, first_name = ?, last_name = ? WHERE id = ?";
        const updateparams = [address, first_name, last_name, id];
        con.query(updateSql, updateparams, (err, updateResult) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({ message: "Error updating user", status: 0, data: [] });
          }

          // Respond with success and updated user data
          res.status(200).json({
            message: "User details updated successfully2",
            status: 1,
            data: {
              user_id: id,
            },
          });
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", status: 0, data: [] });
  }
};

const update_password = async (req, res) => {
  const { email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = "UPDATE users SET password= ? WHERE email = ?";
    con.query(sql, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Error changing password", status: 0, data: [] });
      }
      res.status(200).json({
        message: "User password updated successfully",
        status: 1,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", status: 0, data: [] });
  }
};
const handleLogout = async (req, res) => {
  try {
    const userid = req.userId; //middleware

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    res.clearCookie("accessToken", cookiesOption);

    return res.json({
      message: "Logout successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

module.exports = {
  handleSignup,
  handleSignin,
  get_profile,
  update_profile,
  update_password,
  handleLogout,
};
