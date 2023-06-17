import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Account = new Schema({
    avatar: { type: String },
    nickname: { type: String },
    fullname: { type: String },
    username: { type: String },
    bio: { type: String },
    password: { type: String },
    role: { type: String },
    myVideo: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    videoliked: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    following: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    follow: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
},
    {
        timestamps: true
    }
);

export default mongoose.model('Account', Account)