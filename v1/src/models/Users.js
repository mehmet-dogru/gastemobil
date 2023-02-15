const mongoose = require("mongoose");
const logger = require("../scripts/logger/Users");

const UserSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Email alanı zorunludur!"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    profile_image: {
      type: String,
      default: "http://localhost:3000/uploads/users/blank-profile-avatar.png",
    },
    following: [
      {
        date: Date,
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "user",
        },
      },
    ],
    followers: [
      {
        date: Date,
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "user",
        },
      },
    ],
    savedNews: [
      {
        date: Date,
        news_id: {
          type: mongoose.Types.ObjectId,
          ref: "news",
        },
      },
    ],
    sharedNews: [
      {
        news_id: {
          type: mongoose.Types.ObjectId,
          ref: "news",
        },
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isFollowing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

UserSchema.post("save", (doc) => {
  logger.log({
    level: "info",
    message: doc,
  });
});

const User = mongoose.model("user", UserSchema);

module.exports = User;
