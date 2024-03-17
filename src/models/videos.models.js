import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videosSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: true
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

    }
)

videosSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videosSchema)