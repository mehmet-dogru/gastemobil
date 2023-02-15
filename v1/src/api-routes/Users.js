const express = require("express");
const router = express.Router();

const UserController = require("../controllers/User");
const adminMiddleware = require("../middlewares/adminMiddleware");
const authenticateToken = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const validationSchema = require("../validations/Users");

router.route("/").get(authenticateToken, UserController.index);
router.route("/").post(validate(validationSchema.createValidation), UserController.create);
router.route("/:id").get(authenticateToken, UserController.getUserById);
router.route("/user/info").get(authenticateToken, UserController.getCurrentUser);

router.route("/:id").delete(authenticateToken, adminMiddleware, UserController.delete);

router.route("/login").post(validate(validationSchema.loginValidation), UserController.login);

router.route("/update-profile-image").post(authenticateToken, UserController.updateProfileImage);

router.route("/:id/follow").post(authenticateToken, UserController.follow);
router.route("/:id/unfollow").post(authenticateToken, UserController.unfollow);

router.route("/reset-password").post(validate(validationSchema.resetPasswordValidation), UserController.resetPassword);

router.route("/search/username").get(authenticateToken, UserController.searchUser);

router.route("/user/followers").get(authenticateToken, UserController.getCurrentUserFollowers);
router.route("/user/following").get(authenticateToken, UserController.getCurrentUserFollowing);

module.exports = router;
