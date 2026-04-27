
const socket = io(); // Connect to the server
const conversationForm = document.getElementById('conversationForm');
const form = document.getElementById('form');
const messageInput = document.getElementById('messageInput');
const userId = document.getElementById('user1Id');
const user2Id = document.getElementById('user2Id');
const messages = document.getElementById('messages');
// const mydb = require("../config.js")


socket.emit("registerUser", { userId: 5 }); // Register the user with the server
conversationForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page refresh on form submit
    if (userId.value && user2Id.value) {
        socket.emit("joinRoom",
            { userId: parseInt(userId.value), roomId: parseInt(user2Id.value) });
    }
    socket.on("chat:receive", (data) => {
        const senderId = data.sender_id;
        const messageText = data.message;
        if (senderId && messageText) {
            const item = document.createElement('li');
            item.textContent = `${senderId}: ${messageText}`;
            messages.appendChild(item);
            // Auto-scroll to the latest message
            window.scrollTo(0, document.body.scrollHeight);
        }
    })
    return false;
});
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page refresh on form submit
    if (messageInput.value) {
        socket.emit('chat:send', {
            roomId: parseInt(user2Id.value),
            msg: messageInput.value,
            senderId: parseInt(userId.value)
        });
        messageInput.value = ''; // Clear the input field
    }
    return false;
});

// Listen for the 'chat message' event FROM the server
socket.on('msg:data', (data) => {
    const messagesConversation = data;
    // console.log("Sender ID:", user1Id, "Receiver ID:", user2Id);
    messagesConversation.forEach(element => {
        const user1Id = element.senderId;
        const messageText = element.msg;
        const item = document.createElement('li');
        item.textContent = `${user1Id}: ${messageText}`;
        messages.appendChild(item);
    });
    // Auto-scroll to the latest message
    window.scrollTo(0, document.body.scrollHeight);
});
