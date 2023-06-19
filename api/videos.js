import express from 'express'

const router = express.Router()
import VideoController from '../controller/Video.js'

router.get('/getAllVideo', VideoController.Get)
router.post('/upload', VideoController.Create)
router.get('/:videoId', VideoController.GetVideoById)

export default router