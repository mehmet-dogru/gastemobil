const mongoose = require("mongoose");
const logger = require("../scripts/logger/News");

const NewsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    location: {
      type: String,
      required: true,
    },
    media: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    comments: [
      {
        comment: String,
        commented_at: Date,
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "user",
        },
        profile_image: String,
        username: String,
      },
    ],
    likes: [
      {
        liked_at: Date,
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "user",
        },
      },
    ],
    saves: [
      {
        saved_at: Date,
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "user",
        },
      },
    ],
    isLike: {
      type: Boolean,
      default: false,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

NewsSchema.post("save", (doc) => {
  logger.log({
    level: "info",
    message: doc,
  });
});

const News = mongoose.model("news", NewsSchema);

module.exports = News;
