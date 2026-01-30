
const jwt = require("jsonwebtoken");
const mydb = require("../config");
const JWT_SECRET = 'this-secret-key-should-be-changed-in-production';

function verifyToken(req, res, next) {
    const token = req.header("Authorization")
    if (!token) {
        return res.status(400).json({ success: false, message: "no token provided" })
    }
    const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;
    mydb.query("SELECT * FROM blacklisted WHERE token = ?", [tokenValue], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Couldn't connect to database" })
        }
        if (result.length > 0) {
            return res.status(401).json({ success: false, message: "Unauthorized! Token is blacklisted" })
        }
        jwt.verify(tokenValue, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, message: "Unauthorized" + err })
            }
            req.userId = decoded.id;
            next();
        })
    })
}

module.exports = verifyToken
