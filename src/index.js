const express = require('express')
const http = require('http')
const path = require('path')
const Filter = require('bad-words')
const socketio = require('socket.io')
const {generateMessage, generateLocationMessage} =require('./utils/messages')
const {addUser,removeUser,getUser, getUserInRoom} = require('./utils/users')

const app=express()
const server = http.createServer(app)
const io = socketio(server)

const publicPath = path.join(__dirname,'../public')
const port = process.env.PORT || 3000

app.use(express.static(publicPath))



io.on('connection', (socket)=>{
    console.log('New websocket connection')

    socket.on('join', ({username,room}, callback) =>{
        const { error, user} = addUser({id: socket.id, username, room })
        
        if(error) {
            return callback(error)
        }
        
        socket.join(user.room)
        socket.emit('message', generateMessage("Admin",'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin",user.username+" has Joined"))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg1, callback)=>{
        const filter = new Filter
        if(filter.isProfane(msg1)){
            return callback('Message contains Profane words')
        }
        const user= getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username,msg1))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin',user.username+' has left'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (obj, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,"https://google.com/maps?q="+ obj[0] +"," +obj[1]))
        callback()
    })
})

server.listen(port,()=>{
    console.log("server is listening to port   " + port)
})