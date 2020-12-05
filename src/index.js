const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const  Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');
 
const app = express();
const server = http.createServer(app); //express does this behind scene but we do it in order to be able to pass the server to socket.io
const io = socketio(server); //connfidure socket io to work with a given server
 
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');// Views Path

//Setup static directory to serve 
app.use(express.static(publicDirectoryPath)); // //This is what you will get in the main page (localhost:3000)

io.on('connection', (socket) => {
    console.log('New websocket connection');

    socket.on('join', ({ username, room }, callback ) => {
        const { error, user } = addUser({id: socket.id, username, room });

        if (error) {
            return callback(error);
        } 

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome'));// emits event to ONE SPECIFIC connections
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`));// emits event to all connections besides this one
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        if(!user) {
            return
        }

        const filter = new Filter();

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));// emits event to ALL connections
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);

        //io.emit('message', `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));
         callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left!`)); 
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});



app.get('', (req,res) => {

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})