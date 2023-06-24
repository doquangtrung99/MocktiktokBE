import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Comment = new Schema({
    content: { type: String, require: true },
    user: { type: Schema.Types.ObjectId, ref: 'Account' },
    like: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    reply: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
},
    {
        bufferCommands: true,
        timestamps: true
    }
);

export default mongoose.model('Comment', Comment);