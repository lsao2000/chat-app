const express = require("express")
const verifyToken = require("./middleware/authMiddleware")
const mydb = require("./config")
const { verify } = require("jsonwebtoken")


const chatApp = express()


chatApp.get("/users", verifyToken, (req, res) => {
    try {
        const userId = req.userId
        mydb.query("SELECT user_id,name,email,age,gender,bio,image_url FROM users WHERE user_id != ?", [userId], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Database Error " + err.message })
            }
            else if (result.length === 0) {
                return res.status(400).json({ success: false, message: "There is no user found" })
            }
            return res.status(200).json({ success: true, result })
        })
    } catch (error) {
        return res.status(404).json({ success: false, message: "Error: " + error.message })
    }
})

chatApp.post("/send-message", verifyToken, (req, res) => {
    try {
        const sender_id = req.userId
        // const user2Id = req.params.freindId
        const { message, user2Id } = req.body
        if (!message || !user2Id) {
            return res.status(500).json({ success: false, message: "message text and user2Id are required" })
        }
        getOrCreateConversation(sender_id, user2Id, (err, conversation_id) => {
            const messageData = {
                sender_id,
                conversation_id,
                message
            }
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error 1: " + err.message
                })
            }
            mydb.query("INSERT INTO conversation_messages SET ?", messageData, (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: `Database Error 2 : ${err.message}` })
                }
                return res.status(201).json({ success: true, message: "Message has been sent succesfully" })
            })
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
})
chatApp.get("/freinds", verifyToken, (req, res) => {
    try {
        const userId = req.userId
        mydb.query("select users.user_id,users.name,users.gender,users.image_url from conversation_group convG1 join conversation_group convG2 on convG1.conversation_id = convG2.conversation_id " +
            "join users on users.user_id = convG2.user_id where convG1.user_id = ? and convG2.user_id != ?", [userId, userId], (err, result) => {
                if (err) {
                    return res.json({ error: err.message })
                }
                return res.json({ success: true, result })
            })
        // return res.json({ status: true, message: userId })
    } catch (error) {
        return res.json({ error: error.message })
    }
})
function getOrCreateConversation(user1Id, user2Id, cb) {
    mydb.query("SELECT  convG1.conversation_id from conversation_group convG1 JOIN conversation_group convG2 ON convG1.conversation_id = convG2.conversation_id" +
        "WHERE convG1.user_id = ? AND convG2.user_id = ?", [user1Id, user2Id], (err, result) => {
            if (err) {
                return cb(err)
            }
            else if (result.length > 0) {
                return cb(null, result[0].conversation_id)
            }
            else {
                mydb.query("INSERT INTO conversation VALUES() ", (err, insertResult) => {
                    const conversation_id = insertResult.insertId;
                    if (err) {
                        return cb(err)
                    }
                    mydb.query("INSERT INTO conversation_group VALUES(?,?) ,(?,?)", [conversation_id, user1Id, conversation_id, user2Id], (err, result) => {
                        if (err) {
                            return cb(err)
                        }
                        return cb(null, conversation_id)
                    })
                })
            }
        })
}

module.exports = { chatApp }
