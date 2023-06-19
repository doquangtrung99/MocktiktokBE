
import MessageModel from "../model/Message.js"
// import AccountModel from "../model/Account.js"

class Message {

    async Create(req, res, next) {

        try {
            const { from, to, message } = req.body

            const response = await MessageModel.create({
                message,
                inRoom: [from, to],
                sender: from
            })
            if (response) {
                res.status(200).json('Add Message Successful')
            }
        } catch (error) {
            console.log(error)
            // throw new Error('error::', error)
        }

    }

    async GetAllMessage(req, res, next) {

        try {
            const { from, to } = req.query
            const response = await MessageModel.find({
                inRoom: {
                    $all: [from, to]
                }
            })

            res.status(200).json(response)
        } catch (error) {
            console.log('err', error)
            // throw new Error('error::', error)
        }

    }


}

export default new Message