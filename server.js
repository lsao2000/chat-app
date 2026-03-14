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
const { log } = require('console');
const { sortAndDeduplicateDiagnostics } = require('typescript');
// const realtimeChat = require("./realtime-chat.js")


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
        // socket.join(userId);
        console.log(`User ${socket.id} joined room ${userId}`);
    });
    socket.on("joinRoom", (data) => {
        const user1Id = data.user1Id;
        const user2Id = data.user2Id;
        try {
            mydb.query("SELECT convG1.conversation_id from conversation_group convG1 JOIN conversation_group convG2 ON convG1.conversation_id = convG2.conversation_id " +
                "WHERE convG1.user_id = ? AND convG2.user_id = ?", [user1Id, user2Id], (err, result) => {
                    if (err) {
                        console.log("Database error:", err);
                    } else if (result.length > 0) {
                        const conversation_id = result[0].conversation_id
                        socket.join(conversation_id);
                        console.log(`User ${socket.id} joined conversation ${conversation_id}`);
                        mydb.query("select * from conversation_messages where conversation_id = ?", [conversation_id], (err, res) => {
                            messagesData = [];
                            if (err) {
                                console.error("Error fetching messages:", err);
                            } else if (res.length > 0) {
                                if (res.length > 1) {
                                    res.forEach(msg => {
                                        messagesData = [...messagesData, {
                                            senderId: msg.sender_id,
                                            receiverId: user1Id === msg.sender_id ? user2Id : user1Id,
                                            msg: msg.message,
                                        }];
                                    });
                                } else if (res.length === 1) {
                                    messagesData = [...messagesData, {
                                        senderId: res[0].sender_id,
                                        receiverId: user1Id === res[0].sender_id ? user2Id : user1Id,
                                        msg: res[0].message,
                                        // timestamp: res[0].created_at
                                    }];
                                }
                                // messagesData = [...messagesData, data]
                                // console.log("Fetched messages:", res);
                                socket.emit('conversation_data', messagesData);
                                // io.emit('conversation_data', messagesData);
                            }
                        });
                        // socket.
                    } else {
                        console.log("No conversation found between these users.");
                    }
                });
        } catch (error) {

        }
    });

    socket.on('chat message', (data) => {
        // console.log('message: ' + data.msg + ' from user: ' + data.user);
        const user1Id = parseInt(data.senderId);
        const user2Id = parseInt(data.receiverId);
        const messageText = data.msg;
        try {
            mydb.query("SELECT convG1.conversation_id from conversation_group convG1 JOIN conversation_group convG2 ON convG1.conversation_id = convG2.conversation_id " +
                "WHERE convG1.user_id = ? AND convG2.user_id = ?", [user1Id, user2Id], (err, result) => {
                    if (err) {
                        console.log("Database error:", err);
                    }
                    else if (result.length > 0) {
                        const conversation_id = result[0].conversation_id;
                        messagesData = [data]
                        io.to(conversation_id).emit('chat message', messagesData);
                    } else {
                        console.error("No conversation found between these users.");
                    }
                })
        } catch (error) {
            console.error("Error retrieving conversation:", error);
        }
    });
    socket.on('disconnect', () => {
    });
})
io.emit("welcome", "WELCOME TO THE REALTIME CHAT APPLICATION");


const PORT = 3000;
server.listen(PORT, () => {
    console.log("SERVER RUNING");
})




