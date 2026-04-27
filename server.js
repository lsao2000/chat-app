const express = require('express');
const postApp = require('./posts.js');
const interactionApp = require('./interactions.js');
const { authApp, logout } = require('./auth.js');
const { chatApp } = require('./chat.js');
const path = require("path")
const http = require("http");
const { Server } = require("socket.io")
const cors = require("cors")
const mydb = require("./config.js");


const app = express();
const server = http.createServer(app)
const io = new Server(
    server,
    {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "DELETE", "UPDATE"]
        }
    }
)
app.use(cors())
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use("/chat", express.static(path.join(__dirname, 'public')));
app.use("/api", postApp)
app.use("/api", interactionApp);
app.use("/auth", authApp)
app.use("/logout", logout)
app.use("/api", chatApp)
var messagesData = [];
io.on("connection", (socket) => {
    console.log('a user connected ' + socket.id);
    socket.on("registerUser", (data) => {
        const userId = data.userId;
        console.log(`User ${socket.id} registered with userId: ${userId}`);
        // socket.join(userId);
    });

    socket.on("joinRoom", (data) => {
        const userId = data.userId;
        const roomId = data.roomId;
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
        try {
            mydb.query("SELECT * FROM conversation_messages WHERE conversation_id = ?", [roomId], (err, result) => {
                if (err) {
                    console.error("Database error:", err);
                } else if (result.length > 0) {
                    const messagesData = result.map(msg => ({
                        senderId: msg.sender_id,
                        receiverId: userId === msg.sender_id ? null : userId, // Assuming the receiver is the other user in the conversation
                        msg: msg.message,
                    }));
                    socket.emit('msg:data', messagesData);
                } else {
                    console.log("No messages found for this conversation.");
                }
            })
        } catch (error) {
            console.error("Error retrieving conversation:", error);
        }
    });

    socket.on("chat:send", (data) => {
        const conversation_id = data.roomId;
        const message = data.msg;
        const sender_id = data.senderId;
        console.log("Received chat:send event with data:", data);
        console.log(`Received message from user ${sender_id} in conversation ${conversation_id}: ${message}`);
        if (!conversation_id || !message || !sender_id) {
            console.error("Missing required fields: roomId, messageText, or senderId");
            return;
        }
        const messageData = {
            sender_id,
            conversation_id,
            message
        }
        io.to(conversation_id).emit("chat:receive", messageData);
        // mydb.query("INSERT INTO conversation_messages SET ?", messageData, (err, result) => {
        //     if (err) {
        //         console.error("Database error:", err);
        //         return;
        //     }
        //     console.log("Message inserted into database with ID:", result.insertId);
        // })
    })

    socket.on('disconnect', () => {
        console.log('user disconnected ' + socket.id);
    });
})
io.emit("welcome", "WELCOME TO THE REALTIME CHAT APPLICATION");


const PORT = 3000;
server.listen(PORT, () => {
    console.log("SERVER RUNING");
})




