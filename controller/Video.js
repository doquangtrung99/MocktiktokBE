import Videos from '../model/Video.js'
import Account from '../model/Account.js'
class Video {

    async Get(req, res, next) {

        const page = req.query.page
        const limit = req.query.limit
        const totalDocs = await Videos.countDocuments()
        const totalPage = totalDocs / limit

        Videos.find()
            .skip(page * limit)
            .limit(limit)
            .populate({ path: 'ownerVideo', select: 'nickname fullname avatarUrl _id follow' })
            .populate({
                path: 'comment'
            })
            .then(content => res.status(200).json({ video: content, totalPage }))
            .catch(next)
    }

    async GetVideoOfUserFollowing(req, res, next) {

        const id = req.params.userId

        const user = await Account.findById(id)
            .select('following')
            .populate({
                path: 'following', select: 'myVideo',
                populate: {
                    path: 'myVideo',
                    select: '-createdAt -updatedAt -__v'
                }
            })

        res.json(user.following)
    }

    async GetVideoById(req, res) {

        const videoId = req.params.videoId

        Videos.findOne({ _id: videoId })
            .populate({ path: 'ownerVideo', select: 'nickname fullname avatarUrl _id follow' })
            .populate({
                path: 'comment',
                populate: {
                    path: 'user',
                    select: '-password'
                }
            }).then(response => res.status(200).json(response)).catch(err => console.log(err))


    }

    async Create(req, res, next) {
        const { userId, ...others } = req.body

        const user = await Account.findById({ _id: userId })

        const video = await Videos.create({
            ownerVideo: user._id,
            ...others,
        })

        await user.updateOne({ $push: { myVideo: video._id } })
        res.status(200).json({
            statuscode: 'success'
        })
    }
}

export default new Video