const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' directory
app.use(express.static('public'));

// Create a session and generate a unique ID
const sessions = {}; // Store active sessions in memory

app.get('/create-session', (req, res) => {
    // Generate a random session code
    const sessionCode = Math.random().toString(36).substring(2, 8);
    sessions[sessionCode] = { users: [] }; // Add the session code to the memory
    res.redirect(`/session/${sessionCode}`); // Redirect to the session's URL
});

const path = require('path');
app.get('/session/:code', (req, res) => {
    const sessionCode = req.params.code;
    if (sessions[sessionCode]) {
        // Use path.join to resolve the absolute path
        res.sendFile(path.join(__dirname, '../public/session.html'));
    } else {
        res.status(404).send('Session not found');
    }
});


io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Join the session based on the session code
    socket.on('joinSession', (sessionCode) => {
        if (sessions[sessionCode]) {
            socket.join(sessionCode);
            sessions[sessionCode].users.push(socket.id); // Add user to session
            console.log(`User joined session: ${sessionCode}`);
        } else {
            socket.emit('error', 'Session not found');
        }
    });

    socket.on('updateVitals', (data) => {
        const { sessionCode, vitals } = data;
        if (sessions[sessionCode]) {
            io.to(sessionCode).emit('vitalsUpdated', vitals); // Emit to all users in session
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
