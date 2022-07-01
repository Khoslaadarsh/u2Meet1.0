const express = require('express');
const app = express();
const path = require('path');
const moment = require('moment');
const {userJoin, GetCurrentUser, userLeave, getRoomUsers} = require('./backend/utils/users');
const e = require('express');
const server = require('http').createServer(app);
const port = process.env.PORT || 5000

const io = require('socket.io')(server);
const publicPath = path.join(__dirname, './public');
app.use(express.static(publicPath));

io.on('connection', (socket)=>{
    // console.log("What is scoket: ", socket);
    console.log('Socket is active to be connected');

    socket.on('joinRoom', (data)=>{
        
        const user = userJoin(socket.id, data.usrName, data.room);
        socket.join(user.room);

        var users = getRoomUsers(user.room);
        // Welcome to the user
        socket.emit('UserJoinedTONew', `Welcome to u2Meet in room ${user.room}`, users);

        // Broadcast when a user connects socket.emit->to user itself, broadcast -> to everyone except user, io.emit-> to everyone
        
        socket.broadcast.to(user.room).emit('UserJoinedToAll', `${user.userName} has joined the chat`, user.userName);

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room : user.room,
            users: getRoomUsers(user.room)
        });
    });

    
    socket.on('video-offer', (msg)=>{
        // console.log(msg);
        var ID = null;
        var users = getRoomUsers(msg.room);
        // console.log(msg.target);
        users.forEach(user => {
            if(user.userName == msg.target){
                ID = user.id;
            }
        });
        socket.broadcast.to(ID).emit('video-offer', msg);
    });
    socket.on('video-answer', (msg)=>{
        var ID = null;
        var users = getRoomUsers(msg.room);
        users.forEach(user => {
            if(user.userName == msg.target){
                ID = user.id;
            }
        });
        socket.broadcast.to(ID).emit('video-answer', msg);
    });

    socket.on('new-ice-candidate', msg=>{
        var ID = null;
        var users = getRoomUsers(msg.room);
        users.forEach(user => {
            if(user.userName == msg.target){
                ID = user.id;
            }
        });
        socket.broadcast.to(ID).emit('new-ice-candidate', msg);
    })

    socket.on('chat', (payload)=>{
        const user = GetCurrentUser(socket.id);
        socket.to(user.room).emit('chat', payload);
    });


    // runs when a user disconnected
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('userLeft', `${user.userName} left `, user);
        }
    })
});

server.listen(port, ()=>{
    console.log('Server is listening at port 5000...');
});
