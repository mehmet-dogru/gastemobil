const express = require("express");
const router = express.Router();

const NewsController = require("../controllers/News");
const UserController = require("../controllers/User");
const authenticateToken = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const validationSchema = require("../validations/News");

router.route("/").get(authenticateToken, NewsController.index);
router.route("/").post(authenticateToken, validate(validationSchema.createValidation), NewsController.create, UserController.saveSharedNews);
router.route("/user-news").get(authenticateToken, NewsController.getCurrentUserNews);
router.route("/:userId/user-news").get(authenticateToken, NewsController.getNewsByUserId);

router.route("/following-user-news").get(authenticateToken, NewsController.getFollowingUserNews);
router.route("/:id").delete(authenticateToken, NewsController.remove, UserController.removeSharedNews);
router.route("/:id/add-news-media").post(authenticateToken, NewsController.updateMedia);

router.route("/:newsId/comments").get(authenticateToken, NewsController.getCommentById);
router.route("/:id/make-comment").post(authenticateToken, validate(validationSchema.commentValidation), NewsController.makeComment);
router.route("/:id/:commentId/delete-comment").delete(authenticateToken, NewsController.deleteComment);

router.route("/:id/like").post(authenticateToken, NewsController.likeNews);
router.route("/:id/unlike").post(authenticateToken, NewsController.unlikeNews);

router.route("/:id/save").post(authenticateToken, NewsController.saveNews);
router.route("/:id/unsave").post(authenticateToken, NewsController.unsaveNews);

router.route("/saved-news").get(authenticateToken, NewsController.getCurrentUserSavedNews);

module.exports = router;
