import express from 'express';
import MessageController from '../controller/Message.js';

const router = express.Router();

router.post('/create', MessageController.Create)
router.get('/get', MessageController.GetAllMessage)

export default router;