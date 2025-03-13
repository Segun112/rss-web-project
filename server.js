const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory user storage
const users = {};

// API to create an account
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Username and password are required.' });
    }

    if (users[username]) {
        return res.status(400).send({ message: 'Username already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { username, password: hashedPassword };
    res.status(200).send({ message: 'Account created successfully.' });
});

// API to log in
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users[username];
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send({ message: 'Invalid username or password.' });
    }

    res.status(200).send({ message: 'Login successful.', username });
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
    console.log('A user connected.');

    socket.on('chatMessage', (data) => {
        const { username, message } = data;
        io.emit('chatMessage', { username, message });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

server.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
