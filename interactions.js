const express = require("express");
const jwt = require("jsonwebtoken")
const verifyToken = require("./middleware/authMiddleware.js")

const mydb = require("./config.js")
const interactionApp = express();

interactionApp.post("/addInteractions/:postId", verifyToken, (req, res) => {
    try {
        const postId = req.params.postId
        const { interactionType } = req.body;
        const userId = req.userId;
        if (!interactionType) {
            return res.status(400).json({
                success: false,
                message: "Interaction type is required"
            });
        }
        mydb.query("INSERT INTO interactions SET type = ?, post_id = ?, interactor_id = ? ", [interactionType, postId, userId], (err, result) => {
            if (err) {
                res.status(400).json({
                    success: false,
                    message: "database Error " + err.message
                })
            }
            res.status(201).json({ success: true, message: "Interaction addedd succesfully" })
            // else if(result){
            // }
        })

    } catch (error) {
        res.status(404).json({
            message: "Error in adding interaction",
            error: error.message
        });
    }

})

interactionApp.delete("/removeInteractions/:postId", verifyToken, (req, res) => {
    try {
        const postId = req.params.postId
        const userId = req.userId
        mydb.query("DELETE FROM interactions WHERE post_id = ? AND interactor_id = ?", [postId, userId], (err, result) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Error " + err.message })
            }
            else if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: "Couldn't find post id or userId" });
            }
            return res.status(200).json({ success: true, message: "Interaction removed " })
        })
    } catch (error) {
        return res.status(404).json({
            message: "Error in removing interaction",
            error: error.message
        });
    }

})

interactionApp.get("/postInteractions/:postId", (req, res) => {
    try {

        const postId = parseInt(req.params.postId)
        mydb.query("SELECT * FROM interactions WHERE post_id = ?", [postId], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: `Database Error ${err.message}` })
            }
            else if (result.length === 0) {
                return res.status(400).json({
                    success: false, message: "Couldn't find interactions for the post",
                })
            }
            return res.status(200).json({
                success: true,
                message: "interactions fitched succesfully",
                result,
            })
        })
    } catch (error) {
        res.status(400).json({ success: false, message: `Error : ${error.message}` })
    }
})

interactionApp.put("/changeInteractions/:postId", verifyToken, (req, res) => {
    try {
        const postId = req.params.postId
        const { type } = req.body
        const userId = req.userId
        mydb.query("UPDATE interactions SET type = ? WHERE post_id = ? AND interactor_id = ?", [type, postId, userId], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: `Database Error ${err.message}` })
            } else if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: "Couldn't find post" })
            }
            return res.status(200).json({
                success: true,
                message: "interactions fitched succesfully",
                result
            })
        })
    } catch (error) {
        return res.status(400).json({ success: false, message: `Error : ${error.message}` })

    }
})


module.exports = interactionApp
