const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public' directory
app.use(express.static('public'));

// Store active sessions in memory
const sessions = {}; // Example session storage

// Route to create a session
app.get('/create-session', (req, res) => {
    const sessionCode = Math.random().toString(36).substring(2, 8);
    sessions[sessionCode] = { users: [] };
    // Redirect the creator to the controls page
    res.redirect(`/controls/${sessionCode}`);
});

// Serve the controls page
app.get('/controls/:code', (req, res) => {
    const sessionCode = req.params.code;
    if (sessions[sessionCode]) {
        res.sendFile(path.join(__dirname, '../public/controls.html'));
    } else {
        res.status(404).send('Session not found');
    }
});

// Route to serve the session page
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

    // Handle leaving a session
    socket.on('leaveSession', (sessionCode) => {
        // Verify the session exists before performing any operations
        if (sessions[sessionCode]) {
            socket.leave(sessionCode);
            const userIndex = sessions[sessionCode].users.indexOf(socket.id);
            if (userIndex !== -1) {
                sessions[sessionCode].users.splice(userIndex, 1);
                console.log(`User left session: ${sessionCode}`);
            }

            // Notify the user that they've left
            socket.emit('leftSession', { message: 'You have left the session.' });
        } else {
            // Log and inform the user when attempting to leave a session that doesn't exist
            console.warn(`User attempted to leave nonexistent session: ${sessionCode}`);
            socket.emit('error', { message: 'Session not found' });
        }
    });

    // Handle ending a session
    socket.on('endSession', (sessionCode) => {
        if (sessions[sessionCode]) {
            // Notify all users in the session that it has ended
            io.to(sessionCode).emit('sessionEnded', { message: 'The session has ended.' });

            // Delete the session
            delete sessions[sessionCode];
            console.log(`Session ended: ${sessionCode}`);
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
        // Remove user from sessions
        for (const sessionCode in sessions) {
            const userIndex = sessions[sessionCode].users.indexOf(socket.id);
            if (userIndex !== -1) {
                sessions[sessionCode].users.splice(userIndex, 1);
                console.log(`User disconnected from session: ${sessionCode}`);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});