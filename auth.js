const express = require("express");
const mydb = require("./config.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require('path');
const verifyToken = require("./middleware/authMiddleware.js");
const { log } = require("console");
const JWT_SECRET = 'this-secret-key-should-be-changed-in-production';

const authApp = express();
authApp.use(express.json());
const storage = multer.diskStorage({
    //file destination where is going to be stored
    destination: function(req, res, cb) {
        cb(null, 'uploads/')
    },
    // filename that will be uploaded
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        console.log("File upload attempt")
        const allowedMimeType = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
        const allowedExtension = [".png", ".jpg", ",jpeg", ".gif"]
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedExtension.includes(ext)) {
            log("File accepted by extension")
            return cb(null, true)
        } else if (allowedMimeType.includes(file.mimetype)) {
            log("File accepted by mimeType")
            return cb(null, true)
        }
        // cb(null, false)
        //
        // cb(json({ success: true, message: "only imag" }))
        // cb(new Error("Only images are allowed (jpeg, jpg,png,gif"))
    }
})
authApp.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and Password are required" })
        }
        mydb.query("SELECT * FROM users WHERE email = ? ", [email], async (err, result) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Database Error" });
            } else if (result.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Email does not exist"
                })
            }
            const user = result[0];
            const isPasswordValid = await bcrypt.compare(password, user.password)

            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: "Password is not correct!" })
            }
            const token = jwt.sign({ id: user.user_id }, JWT_SECRET, { expiresIn: '30d' });
            return res.json({
                success: true,
                id: user.id,
                message: "Login successful",
                token,
                user: {
                    id: user.user_id,
                    name: user.name,
                    email: user.email,
                    age: user.age,
                    gender: user.gender,
                    bio: user.bio,
                    image_url: user.image_url
                }
            })
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            meessage: "Error: " + error
        });
    }
})

authApp.post("/register", upload.single("image_url"),async (req, res) => {
    const { name, password, email, gender, bio, age } = req.body;
    if (!name || !password || !email || !gender || !age || !bio) {
        return res.status(400).json({ error: "All Fields are required" });
    } else if (age < 18) {
        return res.status(400).json({ error: "Age must be at least 18" });
    }
    mydb.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        } else if (results.length > 0) {
            return res.status(400).json({ error: "Email Already Exist" });
        }
        const image_url = req.file ? `/uploads/${req.file.filename}` : null
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            name,
            email,
            password: hashedPassword,
            age,
            gender,
            image_url,
            bio
        };
        mydb.query("INSERT INTO users SET ?", userData, (err, result) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Fail to insert user" + err.message });
            }
            const token = jwt.sign({ id: result.insertId }, JWT_SECRET, { expiresIn: '10d' });
            return res.status(201).json({
                success: true,
                message: "user created succesfully",
                token,
                user: {
                    id: result.insertId,
                    name,
                    email,
                    age,
                    gender,
                    image_url,
                    bio
                }
            });

        });
    })

});
function logout(req, res) {
    try {
        const token = req.header("Authorization")
        if (!token) {
            return res.status(400).json({ success: false, message: "no token provided" })
        }
        const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;
        mydb.query("INSERT INTO blacklisted SET token = ?", [tokenValue], (err, result) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Database Error: " + err.message })
            }
            // if (result.affectedRows > 0) {
            return res.status(202).json({ success: true, message: "you are logged out" })
            // }
        })
    } catch (error) {
        return res.status(200).json({ error: error.message })
    }
}
authApp.post("/uploadImage", verifyToken, upload.single("image_url"), (req, res) => {
    try {
        const user_id = req.userId
        const imagePath = req.file ? `/uploads/${req.file.originalname}` : null
        if (imagePath === null) {
            return res.status(400).json({ succes: false, message: "Image not provided" })
        }
        mydb.query("UPDATE users SET image_url = ? WHERE user_id = ?", [imagePath, user_id], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Database error " + err.message })
            }
            else if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: "Couldn't find user" })
            }
            return res.status(200).json({ success: true, message: "Image path updated succesfully" })
        })
    } catch (error) {
        return res.status(400).json({ success: false, message: "Something went wrong" })
    }
});

module.exports = { authApp, logout };
