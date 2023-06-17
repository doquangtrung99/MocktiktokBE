
import MessageModel from "../model/Message.js"
import AccountModel from "../model/Account.js"

class Message {

    async Create(req, res, next) {

        try {
            const response = await MessageModel.create({
                message: req.body.message
            })
            if (response) {
                res.status(200).json('Add Message Successful')
            }
        } catch (error) {
            throw new Error('error::', error)
        }

    }


}

export default new Message