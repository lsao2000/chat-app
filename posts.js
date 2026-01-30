const express = require('express');
const myApp = express();
const verifyToken = require("./middleware/authMiddleware.js")
const mydb = require("./config.js")

myApp.get("/user/me/posts", verifyToken, (req, res) => {
    try {
        const user_id = req.userId;
        mydb.query("SELECT * FROM posts WHERE usr_id = ?", user_id, (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Couldn't connect to database" })
            }
            else if (result.length === 0) {
                return res.status(400).json({ success: false, message: "Couldn't find user posts" })
            }
            return res.status(200).json({ success: true, count: result.length, posts: result })
        })
    } catch (error) {
        res.status(400).json({ success: false, message: `Error ${error.message}` })
    }
})

// add a post
myApp.post("/addPost", verifyToken, (req, res) => {
    try {
        const { topic, description } = req.body;
        if (!topic || !description) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        const usr_id = req.userId;
        const postData = {
            usr_id,
            topic,
            description
        };
        mydb.query("INSERT INTO posts SET ?", postData, (err, result) => {
            if (err) {
                return res.status(400).json({ success: false, message: "Couldn't insert post", error: err.message })
            }
            return res.status(200).json({
                success: true,
                message: "Post created succesfully",
                post: {
                    post_id: result.insertId,
                    usr_id,
                    topic,
                    description,
                }
            })
        })
    } catch (error) {
        res.json({ success: false, message: "Error " + error.message });
    }
})

// delete a post
myApp.delete("/user/deletePost/:id", verifyToken, (req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(500).json({ success: false, message: "postId should be provided" })
        }
        // const user_id = req.userId
        mydb.query("DELETE  FROM posts WHERE post_id = ?", [postId], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: "database Error " + err.message })
            } else if (result.length === 0) {
                return res.status(400).json({ success: false, message: "couldn't find post" })
            }
            console.log(result.length);
            return res.status(200).json({ success: true, message: "post deleted succesfully" })
        })
    } catch (error) {
        return res.status(404).json({ success: false, message: " Error " + error.message })
    }
})
myApp.put("/user/updatePost/:id", verifyToken, (req, res) => {
    try {
        const { topic, description } = req.body;
        const postId = req.params.id;
        if (!topic || !description || !postId) {
            return res.status(500).json({ success: false, message: "description and topic are required" })
        }
        mydb.query("UPDATE posts SET topic = ?, description = ?  WHERE post_id = ?", [topic, description, postId], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: "database error " + err.message })
            }
            else if (result.affectedRows === 0) {
                return res.status(500).json({ success: false, message: "Couldn't find post" })
            }
            return res.send({ success: true, message: "Post updated succesfully" })
        })
    } catch (error) {
        return res.status(404).json({ success: false, message: "Error " + error.message })
    }
})
myApp.get("/allPosts", (req, res) => {
    try {
        mydb.query("SELECT p.post_id, p.topic, p.description, p.created_at, COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes, COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes FROM posts p LEFT JOIN interactions i ON p.post_id = i.post_id GROUP BY p.post_id ORDER BY p.created_at DESC", (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: "database error " + err.message })
            }
            else if (result.length === 0) {
                return res.status(400).json({ success: false, message: "Couldn't find posts" })
            }
            return res.status(200).json({ success: true, count: result.length, posts: result })
        })
    } catch (error) {
        return res.status(404).json({ success: false, message: "Error " + error.message })
    }

})

module.exports = myApp








