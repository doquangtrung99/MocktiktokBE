import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Video = new Schema({
    tick: { type: Boolean },
    nickname: { type: String },
    fullname: { type: String },
    title: { type: String },
    music: { type: String },
    video: { type: String },
    like: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    comment: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
},
    {
        timestamps: true
    }
);

export default mongoose.model('Video', Video)
