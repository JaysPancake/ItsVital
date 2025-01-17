const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
    socket.on('updateVitals', (data) => {
        io.emit('vitalsUpdated', data);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});