import express from 'express';
import AccountController from '../controller/Account.js';
import checkPermission from '../middleware/checkPermission.js';
const router = express.Router();

router.get('/search/:q', AccountController.Search)
router.get('/searchuser/:id', AccountController.GetUser)
router.get('/validatetoken', AccountController.Authorize)
router.get('/commentreply/:commentId', AccountController.GetCommentReply)
router.get('/', AccountController.Get)
router.delete('/delete/:commentId', AccountController.DeleteComment)
router.post('/search', AccountController.SearchFilter)
router.post('/register', AccountController.Create)
router.post('/login', checkPermission(['admin']), AccountController.Login)
router.post('/comment', AccountController.PostComment)
router.post('/reply', AccountController.ReplyComment)
router.put('/like', AccountController.Like)
router.put('/follow', AccountController.Follow)
router.put('/:id/update', AccountController.Update)
router.delete('/deleteuser/:id', AccountController.Delete)

export default router;