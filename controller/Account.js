import Accounts from '../model/Account.js'
import Video from '../model/Video.js'
import Comment from '../model/Comment.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { generateAccessToken, generateRefreshToken } from '../services/user.js'

class Account {
    //[Get] 10 user [path]: /accounts
    Get(req, res, next) {
        Accounts.find({ role: { $ne: 'admin' } })
            .then(content => {
                res.status(200).json(content)
            })
            .catch(next)
    }

    //[Get] search user [path]: /accounts/search/:q

    Search(req, res, next) {

        const s = req.params.q
        const regex = new RegExp(s, 'i')
        Accounts.find({ fullname: { $regex: regex } })
            .then(content => {
                res.status(200).json(content)
            })
            .catch(next)
    }

    //[Get] get specificed user [path]: /accounts/searchuser/:id

    async SearchFilter(req, res, next) {

        const aggregate = []

        if (req.query.searchParams) {
            const regex = new RegExp(req.query.searchParams, 'i')
            aggregate.push({
                $match: {
                    fullname: {
                        $regex: regex
                    }
                }
            })
        }

        if (req.body) {
            switch (req.body.sortBy) {
                case 'nickname':
                    aggregate.push({
                        $sort: {
                            nickname: req.body.asc ? 1 : -1
                        }
                    })
                    break
                case 'fullname':
                    aggregate.push({
                        $sort: {
                            fullname: req.body.asc ? 1 : -1
                        }
                    })
                    break
                default:
                    break;
            }
        }

        aggregate.push({
            $project: {
                avatar: 1,
                nickname: 1,
                fullname: 1,
                myVideo: 1,
                videoliked: 1,
                following: 1,
                follow: 1,
                bio: 1,
            }
        })


        Accounts.aggregate(aggregate)
            .then(data => {
                res.status(200).json(data)
            })
            .catch(err => console.log(err))
    }


    async GetUser(req, res, next) {

        if (req.params.id == 'all') {

            Accounts.find()
                .populate({ path: 'myVideo videoliked following follow' })
                .then(totalUser => {
                    res.status(200).json(totalUser)
                })
                .catch(next)


        } else {

            Accounts.findById(req.params.id)
                .select('-password')
                .populate({
                    path: 'myVideo',
                })
                .populate({
                    path: 'videoliked'
                })
                .populate({
                    path: 'following', select: '_id fullname avatarUrl nickname myVideo',
                    populate: {
                        path: 'myVideo'
                    }
                })
                .then(content => {
                    res.status(200).json(content)
                })
                .catch(error => console.log(error))
        }
    }


    RefreshToken(req, res, next) {

        const refreshToken = req.headers.authorization.split(' ')[1]

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'User was not authenticated',
                    error: err
                })
            }

            const token = generateAccessToken(decoded.id, decoded.role, refreshToken)
            const user = await Accounts.findById(decoded.id).select('-password -__v -createdAt -updatedAt')

            return res.status(200).json({
                accessToken: token,
                user
            })
        })
    }
    //[POST] login user [path]: /login

    async Login(req, res, next) {
        try {
            const hasUsername = await Accounts.findOne({ username: req.body.username })
            if (hasUsername) {
                const hasPassword = await bcrypt.compare(req.body.password, hasUsername.password)
                if (hasPassword) {
                    const { password, ...others } = hasUsername.toObject()
                    const refreshToken = generateRefreshToken(hasUsername._id, hasUsername.role)
                    const token = generateAccessToken(hasUsername._id, hasUsername.role, refreshToken)

                    res.status(200).json({
                        ...others, data: {
                            token,
                            user: hasUsername
                        }, status: 'success'
                    })
                } else {
                    res.status(200).json({
                        message: 'invalid password'
                    })
                }
            } else {
                res.status(200).json({
                    message: 'invalid username'
                })
            }

        } catch (error) {
            console.log(error)
        }

    }

    //[Post] create user [path]: /register

    async Create(req, res, next) {

        const hasUserName = await Accounts.findOne({ username: req.body.username })
        if (hasUserName) {
            res.status(200).json({
                status: 'This username has been existed'
            })
            return
        }
        const salt = await bcrypt.genSalt(10);
        const hassPassword = await bcrypt.hash(req.body.password, salt)

        await Accounts.create({
            ...req.body,
            role: 'user',
            password: hassPassword
        })
            .then(result => res.json({
                status: 'Create user success'
            }))
            .catch(next)
    }

    // Authorize user [path]: /validatetoken

    Authorize(req, res, next) {
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'Unauthorized',
                    error: err
                })
            }

            const user = await Accounts.findById(decoded.id).select('-password -__v -createdAt -updatedAt')

            return res.status(200).json(user)
        })
    }

    // [Delete] documents soft deleted 
    Delete(req, res, next) {
        Accounts.delete({ _id: req.params.id })
            .then(result => res.status(200).json({
                status: 'success'
            }))
            .catch(next)
    }


    //[PUT] update like field of documents

    async Like(req, res, next) {

        // userId sở hữu video  và user hiện tại mà like video
        const [video, user] = await Promise.all([Video.findById(req.body.likedVideoId), Accounts.findById(req.body.userLikeId)])

        if (user.videoliked.includes(video._id)) {
            await user.updateOne({ $pull: { videoliked: video._id } })
        } else {
            await user.updateOne({ $push: { videoliked: video._id } })
        }

        if (video.like.includes(req.body.userLikeId)) {
            await video.updateOne({ $pull: { like: req.body.userLikeId } })
        } else {
            await video.updateOne({ $push: { like: req.body.userLikeId } })
        }

        res.status(200).json(video)
    }

    async Follow(req, res, next) {

        const user = await Accounts.findById(req.body.followedUser)
        const userFollow = await Accounts.findById(req.body.userFollow)

        if (userFollow.following.includes(req.body.followedUser)) {
            await userFollow.updateOne({ $pull: { following: req.body.followedUser } })
        } else {
            await userFollow.updateOne({ $push: { following: req.body.followedUser } })
        }

        if (user.follow.includes(req.body.userFollow)) {
            await user.updateOne({ $pull: { follow: req.body.userFollow } })
        } else {
            await user.updateOne({ $push: { follow: req.body.userFollow } })
        }

        res.status(200).json(user)
    }

    async Update(req, res, next) {

        const user = await Accounts.findById({ _id: req.params.id })

        const fieldUser = {
            ...user.toObject(),
            ...req.body
        }

        await Accounts.updateOne({ _id: req.params.id }, { $set: fieldUser });

        await user.save()

        res.status(200).json({
            statusMessage: 'Success',
            user
        })
    }


    async PostComment(req, res, next) {

        const comment = {
            content: req.body.comment,
            user: req.body.userId
        }

        const [newComment, video] = await Promise.all([Comment.create(comment), Video.findById(req.body.videoId)])

        video.comment.unshift(newComment._id)

        video.save()

        res.status(200).json({
            success: true,
            video
        })
    }

    async DeleteComment(req, res, next) {

        const commentId = req.params.commentId
        const { videoId } = req.body
        const currentVideo = await Video.findById(videoId)

        const [comment] = await Promise.all([Comment.findById(commentId),
        currentVideo.updateOne({ $pull: { comment: commentId } }),
        Comment.findByIdAndDelete(commentId)
        ])

        await Comment.deleteMany({ _id: { $in: comment.reply } })

        res.status(200).json({
            success: true,
        })
    }

    async ReplyComment(req, res, next) {

        const { replyComment, commentId, userId } = req.body

        const comment = {
            content: replyComment,
            user: userId
        }

        const [newReplyComment, currentComment] = await Promise.all([Comment.create(comment), Comment.findById(commentId)])

        currentComment.reply.push(newReplyComment._id)
        currentComment.save()

        res.status(200).json({
            success: true,
        })
    }


    async GetCommentReply(req, res, next) {

        const commentReply = await Comment.findById(req.params.commentId).populate({
            path: 'reply',
            populate: {
                path: 'user'
            }
        })

        res.status(200).json({
            success: true,
            commentReply
        })
    }
}


export default new Account