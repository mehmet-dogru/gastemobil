const httpStatus = require("http-status");
const NewsService = require("../services/NewsService");
const path = require("path");
const UserService = require("../services/UserService");

class News {
  create(req, res, next) {
    const news = {
      ...req.body,
      user_id: req.user_id,
    };

    NewsService.create(news)
      .then((response) => {
        res.status(httpStatus.CREATED).send({ news: response, success: true });
        next({ news_id: response._id });
      })
      .catch((err) => {
        next(err);
      });
  }

  index(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    NewsService.list(page, limit)
      .then((response) => {
        if (!response.length) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Haber bulunamadı!", success: false });
        }

        response
          .map((x) => x.likes.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isLike = true;
            }
          });

        response
          .map((x) => x.saves.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isSaved = true;
            }
          });

        return res.status(httpStatus.OK).send({ news: response, success: true, newsCount: response.length });
      })
      .catch((err) => {
        next(err);
      });
  }

  getCurrentUserNews(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    NewsService.list(page, limit, { user_id: req.user_id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Haber bulunamadı!", success: false });
        }

        response
          .map((x) => x.likes.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isLike = true;
            }
          });

        response
          .map((x) => x.saves.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isSaved = true;
            }
          });

        return res.status(httpStatus.OK).send({ news: response, success: true, newsCount: response.length });
      })
      .catch((err) => {
        next(err);
      });
  }

  getFollowingUserNews(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    UserService.findOne({ _id: req.user_id })
      .then((response) => {
        NewsService.list(page, limit, { user_id: { $in: response.following.map((x) => x.user_id) } })
          .then((response) => {
            if (!response) {
              return res.status(httpStatus.NOT_FOUND).send({ message: "Haber bulunamadı!", success: false });
            }

            response
              .map((x) => x.likes.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
              .forEach((item, index) => {
                if (item) {
                  response[index].isLike = true;
                }
              });

            response
              .map((x) => x.saves.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
              .forEach((item, index) => {
                if (item) {
                  response[index].isSaved = true;
                }
              });

            return res.status(httpStatus.OK).send({ news: response, success: true, newsCount: response.length });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  remove(req, res, next) {
    NewsService.delete({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Kayıt bulunamadı!", success: false });
        }

        res.status(httpStatus.OK).send({ message: "Haber silindi", success: true, deletedNews: response });
        next(req.params.id);
      })
      .catch((err) => {
        next(err);
      });
  }

  makeComment(req, res, next) {
    UserService.findOne({ _id: req.user_id })
      .then((response) => {
        const profile_image = response.profile_image;
        const username = response.username;
        NewsService.findOne({ _id: req.params.id })
          .then((response) => {
            if (!response) {
              return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kayıt bulunmamaktadır!" });
            }

            const comment = {
              ...req.body,
              commented_at: new Date(),
              user_id: req.user_id,
              profile_image: profile_image,
              username: username,
            };

            response.comments.push(comment);
            response
              .save()
              .then((updatedComment) => {
                return res.status(httpStatus.OK).send({ updatedComment: updatedComment, success: true });
              })
              .catch((err) => {
                next(err);
              });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  getCommentById(req, res, next) {
    NewsService.findById(req.params.newsId)
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Haber ve yorumları bulunamadı!", success: false });
        }

        return res.send({ comments: response.comments, success: true });
      })
      .catch((err) => {
        next(err);
      });
  }

  deleteComment(req, res, next) {
    NewsService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kayıt bulunmamaktadır!" });
        }

        response.comments = response.comments.filter((c) => c._id.toString() !== req.params.commentId);

        response
          .save()
          .then((deletedComment) => {
            return res.status(httpStatus.OK).send({ message: "Yorum Silindi", deletedComment: deletedComment, success: true });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  likeNews(req, res, next) {
    NewsService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kayıt bulunmamaktadır!" });
        }

        const userLiked = {
          user_id: req.user_id,
          liked_at: new Date(),
        };

        const likedUserIdList = response.likes.map((x) => x.user_id.toString());

        if (!likedUserIdList.includes(req.user_id.toString())) {
          response.likes.push(userLiked);
          res.status(httpStatus.OK).send({ message: "Haber Beğenildi!" });
        } else {
          res.status(httpStatus.FORBIDDEN).send({ message: "Haber çoktan beğenildi" });
        }

        response.save();
      })
      .catch((err) => {
        next(err);
      });
  }

  unlikeNews(req, res, next) {
    NewsService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kayıt bulunmamaktadır!" });
        }

        response.likes = response.likes.filter((x) => x.user_id.toString() !== req.user_id.toString());

        response
          .save()
          .then((_) => {
            return res.status(httpStatus.OK).send({ message: "Beğenmekten vazgeçildi!", success: true });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  saveNews(req, res, next) {
    NewsService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir haber bulunamadı!", success: false });
        }

        const userSaved = {
          user_id: req.user_id,
          saved_at: new Date(),
        };

        const savedUserIdList = response.saves.map((x) => x.user_id.toString());

        if (!savedUserIdList.includes(req.user_id.toString())) {
          response.saves.push(userSaved);
          res.status(httpStatus.OK).send({ message: "Haber kaydedildi!" });
        } else {
          return res.status(httpStatus.FORBIDDEN).send({ message: "Haber çoktan kaydedildi" });
        }

        response.save();
      })
      .catch((err) => {
        next(err);
      });
  }

  unsaveNews(req, res, next) {
    NewsService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kayıt bulunmamaktadır!" });
        }

        response.saves = response.saves.filter((x) => x.user_id.toString() !== req.user_id.toString());

        response
          .save()
          .then((_) => {
            return res.status(httpStatus.OK).send({ message: "Kaydedilmekten vazgeçildi!", success: true });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  updateMedia(req, res, next) {
    if (!req.files.media) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "Haber medyası güncellenemedi! Lütfen fotoğraf/video yükleyiniz!",
        success: false,
      });
    }

    const extension = path.extname(req.files.media.name);
    const fileName = `${req.params.id}${extension}`;
    const folderPath = path.join(__dirname, "../uploads/medias", fileName);

    req.files.media.mv(folderPath, (err) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Haber medyası yükleme sırasında hata oluştu!",
          error: err,
        });
      }

      NewsService.update(req.params.id, { media: fileName })
        .then((response) => {
          return res.status(httpStatus.OK).send({
            message: "Haber medyası başarıyla güncellendi.",
            imagePath: response.media,
            success: true,
          });
        })
        .catch((err) => {
          next(err);
        });
    });
  }

  getNewsByUserId(req, res, next) {
    const { page = 1, limit = 10 } = req.query;
    NewsService.list(page, limit, { user_id: req.params.userId })
      .then((response) => {
        if (!response.length) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Henüz bir haberiniz yok", success: false });
        }

        response
          .map((x) => x.likes.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isLike = true;
            }
          });

        response
          .map((x) => x.saves.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isSaved = true;
            }
          });

        return res.status(httpStatus.OK).send({ news: response, success: true });
      })
      .catch((err) => {
        next(err);
      });
  }

  getCurrentUserSavedNews(req, res, next) {
    const { page = 1, limit = 10 } = req.query;
    NewsService.list(page, limit, { _id: { $in: req.user.savedNews.map((x) => x.news_id) } })
      .then((response) => {
        response
          .map((x) => x.likes.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isLike = true;
            }
          });

        response
          .map((x) => x.saves.map((y) => y.user_id.toString()).includes(req.user_id.toString()))
          .forEach((item, index) => {
            if (item) {
              response[index].isSaved = true;
            }
          });

        return res.status(httpStatus.OK).send({ savedNews: response, savedNewsCount: response.length });
      })
      .catch((err) => {
        next(err);
      });
  }
}

module.exports = new News();
