import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import accountRouter from './api/account.js';
import messageRouter from './api/message.js'
import videoRouter from './api/videos.js'
import cors from 'cors'

dotenv.config();
mongoose.set('strictQuery', false);
const app = express();

app.use(cors({
    origin: "*"
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use('/accounts', accountRouter);
app.use('/messages', messageRouter);
app.use('/videos', videoRouter);

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_CLOUD);
        console.log('Connected to Mongoose');
    } catch (error) {
        console.error(error);
    }
})();

const server = app.listen(3005, () => {
    console.log('Server listening on port 3005');
});

const socketio = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

global.onlineUsers = {}

socketio.on('connection', socket => {
    console.log('A user connected');

    socket.join('public')

    socket.on('add-user', (userId) => {
        onlineUsers[socket.id] = {
            id: userId,
            online: true,
            offline: 0,
        }
        socketio.in('public').emit('user-connected', onlineUsers)
    });

    socket.on('join-room', room => {
        socket.join(room);
    });

    socket.on('send-message', (room, data) => {
        socket.broadcast.to(room).emit('message-receive', data);
    });

    socket.on('disconnect', () => {

        onlineUsers[socket.id] = {
            ...onlineUsers[socket.id],
            online: false,
            offline: Date.now(),
        }

        socketio.in('public').emit('user-connected', onlineUsers)
        console.log('A user disconnected');
    });
});


export default app;
