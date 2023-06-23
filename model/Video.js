import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Video = new Schema({
    tick: { type: Boolean },
    videoUrl: { type: String },
    videoTitle: { type: String },
    videoHashtag: { type: String },
    ownerVideo: { type: Schema.Types.ObjectId, ref: 'Account' },
    like: [{ type: Schema.Types.ObjectId, ref: 'Account' }],
    comment: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
},
    {
        timestamps: true
    }
);

export default mongoose.model('Video', Video)
