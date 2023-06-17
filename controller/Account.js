import Accounts from '../model/Account.js'
import Video from '../model/Video.js'
import Comment from '../model/Comment.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

class Account {
    //[Get] 10 user [path]: /accounts
    Get(req, res, next) {
        Accounts.find().limit(10)
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

            const page = req.query.page
            const limit = req.query.limit
            const totalDocs = await Accounts.countDocuments({ "myVideo": { "$size": 1 } })

            class Pagination {
                constructor(page, limit, totalDocs) {
                    this.page = page
                    this.totalDocs = totalDocs
                    this.limit = limit
                    this.totalPage = this.totalDocs / this.limit
                }
                getResult() {
                    return Accounts.find({ "myVideo": { "$size": 1 } })
                        .select("-password")
                        .limit(this.limit)
                        .skip(this.page * this.limit)
                        .populate({
                            path: 'myVideo',
                            populate: {
                                path: 'comment',
                                populate: {
                                    path: 'user'
                                }
                            }
                        })
                        .then(content => {
                            res.status(200).json({
                                page,
                                totalPage: Math.ceil(this.totalPage),
                                totalDocs,
                                content
                            })
                        })
                        .catch(next)
                }
            }

            const pagination = new Pagination(page, limit, totalDocs)

            await pagination.getResult()
        } else {

            Accounts.findById(req.params.id)
                .select('-password')
                .populate({
                    path: 'myVideo',
                    select: 'like video',
                })
                .populate({
                    path: 'videoliked'
                })
                .then(content => {
                    res.status(200).json(content)
                })
                .catch(error => console.log(error))
        }
    }
    //[POST] login user [path]: /login

    async Login(req, res, next) {
        try {
            const hasUsername = await Accounts.findOne({ username: req.body.username })
            if (hasUsername) {
                const hasPassword = await bcrypt.compare(req.body.password, hasUsername.password)
                if (hasPassword) {
                    const { password, ...others } = hasUsername.toObject()

                    const token = jwt.sign({ id: hasUsername._id, role: hasUsername.role },
                        process.env.JWT_SECRET, { expiresIn: '1d' })
                    res.status(200).json({ ...others, token, status: 'success' })
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

    // Authorize user [path]: /authorize

    Authorize(req, res, next) {

        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(401).json({
                    status: 'Unauthorized',
                    error: err
                })
            }

            res.status(200).json(decoded)
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

        const [video, user] = await Promise.all([Video.findById(req.body.likedUser), Accounts.findById(req.body.userLike)])

        if (user.videoliked.includes(video._id)) {
            await user.updateOne({ $pull: { videoliked: video._id } })
        } else {
            await user.updateOne({ $push: { videoliked: video._id } })
        }

        if (video.like.includes(req.body.userLike)) {
            await video.updateOne({ $pull: { like: req.body.userLike } })
        } else {
            await video.updateOne({ $push: { like: req.body.userLike } })
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

        user.nickname = req.body.nickname
        user.fullname = req.body.fullname
        user.bio = req.body.bio
        user.avatar = req.body.avatar
        user.save()

        res.status(200).json({
            statusMessage: 'Success'
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