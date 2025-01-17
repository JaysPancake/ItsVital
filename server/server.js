const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' directory
app.use(express.static('public'));

// Store active sessions in memory
const sessions = {}; // Example session storage

// Route to create a session
app.get('/create-session', (req, res) => {
    // Generate a random session code
    const sessionCode = Math.random().toString(36).substring(2, 8);
    sessions[sessionCode] = { users: [] }; // Store session
    res.redirect(`/session/${sessionCode}`); // Redirect to the session's page
});

// Route to serve the session page
const path = require('path');
app.get('/session/:code', (req, res) => {
    const sessionCode = req.params.code;
    if (sessions[sessionCode]) {
        // Serve the session page if the session exists
        res.sendFile(path.join(__dirname, '../public/session.html'));
    } else {
        // If the session doesn't exist, return a 404 error
        res.status(404).send('Session not found');
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    // Event to join a session
    socket.on('joinSession', (sessionCode) => {
        if (sessions[sessionCode]) {
            // If session exists, join the user to the session
            socket.join(sessionCode);
            sessions[sessionCode].users.push(socket.id); // Add the user to the session's list
            console.log(`User joined session: ${sessionCode}`);

            // Emit a confirmation that the user has joined
            socket.emit('sessionJoined', { message: `Successfully joined session: ${sessionCode}` });
        } else {
            // If session doesn't exist, emit an error
            socket.emit('error', { message: 'Session not found' });
        }
    });

    // Event to update vitals in a session
    socket.on('updateVitals', (data) => {
        const { sessionCode, vitals } = data;
        if (sessions[sessionCode]) {
            // Emit vitals update to all users in the session
            io.to(sessionCode).emit('vitalsUpdated', vitals);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Optionally remove user from session on disconnect
        for (let sessionCode in sessions) {
            const userIndex = sessions[sessionCode].users.indexOf(socket.id);
            if (userIndex > -1) {
                sessions[sessionCode].users.splice(userIndex, 1); // Remove the user from the session's user list
                console.log(`User left session: ${sessionCode}`);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});