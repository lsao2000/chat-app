
const socket = io(); // Connect to the server
const conversationForm = document.getElementById('conversationForm');
const form = document.getElementById('form');
const messageInput = document.getElementById('messageInput');
const user1Id = document.getElementById('user1Id');
const user2Id = document.getElementById('user2Id');
const messages = document.getElementById('messages');
// const mydb = require("../config.js")
conversationForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page refresh on form submit
    if (user1Id.value && user2Id.value) {
        socket.emit("joinRoom", { user1Id: parseInt(user1Id.value), user2Id: parseInt(user2Id.value) });
        // Emit a 'chat message' event to the server
        // socket.emit('chat message', {
        //     senderId: parseInt(userId.value),
        //     receiverId: parseInt(freindId.value),
        //     msg: messageInput.value
        // });
        // messageInput.value = ''; // Clear the input field
    }
    return false;
});
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page refresh on form submit
    if (messageInput.value) {
        socket.emit('chat message', {
            senderId: parseInt(user1Id.value),
            receiverId: parseInt(user2Id.value),
            msg: messageInput.value
        });
        messageInput.value = ''; // Clear the input field
    }
    return false;
});
socket.on('conversation_data', (data) => {
    console.log("Conversation data received:", data);
    const messagesConversation = data;
    // console.log("Sender ID:", user1Id, "Receiver ID:", user2Id);
    messagesConversation.forEach(element => {
        const user1Id = element.senderId;
        const user2Id = element.receiverId;
        const messageText = element.msg;
        const item = document.createElement('li');
        item.textContent = `${user1Id}: ${messageText}`;
        messages.appendChild(item);
    });
    // Auto-scroll to the latest message
    window.scrollTo(0, document.body.scrollHeight);

})


// Listen for the 'chat message' event FROM the server
socket.on('chat message', (data) => {
    const messagesConversation = data;
    // console.log("Sender ID:", user1Id, "Receiver ID:", user2Id);
    messagesConversation.forEach(element => {
        const user1Id = element.senderId;
        const user2Id = element.receiverId;
        const messageText = element.msg;
        const item = document.createElement('li');
        item.textContent = `${user1Id}: ${messageText}`;
        messages.appendChild(item);
    });
    // Auto-scroll to the latest message
    window.scrollTo(0, document.body.scrollHeight);
});
