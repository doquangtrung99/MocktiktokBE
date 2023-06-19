import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Message = new Schema({
    message: { type: String },
    inRoom: { type: Array },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'Account'
    }
},
    {
        timestamps: true
    }
);

export default mongoose.model('Message', Message)
