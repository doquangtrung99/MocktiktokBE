import Videos from '../model/Video.js'
import Account from '../model/Account.js'

class Video {

    Get(req, res, next) {
        Videos.find({})
            .populate({ path: 'nickname', select: 'nickname -_id' })
            .populate({ path: 'fullname', select: 'fullname -_id' })
            .populate({ path: 'comment' })
            .then(content => res.status(200).json(content))
            .catch(next)
    }

    async GetVideoById(req, res) {

        const videoId = req.params.videoId

        Videos.findOne({ _id: videoId }).populate({
            path: 'comment'
        }).then(response => res.status(200).json(response)).catch(err => console.log(err))


    }

    async Create(req, res, next) {
        const { userId, ...others } = req.body

        const user = await Account.findById({ _id: userId })

        const video = await Videos.create({
            nickname: user.nickname,
            fullname: user.fullname,
            ...others,
        })

        await user.updateOne({ $push: { myVideo: video._id } })
        res.status(200).json({
            statuscode: 'success'
        })
    }
}

export default new Video