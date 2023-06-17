import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import accountRouter from './api/account.js';
import messageRouter from './api/message.js'
dotenv.config();
mongoose.set('strictQuery', false);
const app = express();

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use('/accounts', accountRouter);
app.use('/messages', messageRouter);

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

socketio.on('connection', socket => {
    console.log('A user connected');

    socket.on('join-room', room => {
        socket.join(room);
    });

    socket.on('chat_message', data => {
        socket.to(data.to).emit('chat_message', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


export default app;
