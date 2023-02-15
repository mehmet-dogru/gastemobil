const httpStatus = require("http-status");
const { passwordToHash, generateAccessToken } = require("../scripts/utils/helper");
const UserService = require("../services/UserService");
const eventEmitter = require("../scripts/events/eventEmitter");
const path = require("path");

class User {
  create(req, res, next) {
    req.body.password = passwordToHash(req.body.password);
    req.body.isAdmin = false;
    UserService.create(req.body)
      .then((response) => {
        const user = {
          _id: response._id,
          full_name: response.full_name,
          username: response.username,
        };
        return res.status(httpStatus.CREATED).send({ user: user, success: true });
      })
      .catch((err) => {
        next(err);
      });
  }

  index(req, res, next) {
    const { page = 1, limit = 10 } = req.query;
    UserService.list(page, limit)
      .then((response) => {
        response = response.filter((admin) => admin.isAdmin !== true);
        return res.status(httpStatus.OK).send({ users: response, success: true, userCount: response.length });
      })
      .catch((err) => {
        next(err);
      });
  }

  getUserById(req, res, next) {
    UserService.findById(req.params.id)
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!" });
        }

        const followers_count = response._doc.followers.length;
        const following_count = response._doc.following.length;
        const shared_news_count = response._doc.sharedNews.length;

        if (response.followers.map((x) => x.user_id.toString()).includes(req.user_id.toString())) {
          response.isFollowing = true;
        }

        delete response._doc.following;
        delete response._doc.followers;
        delete response._doc.password;
        delete response._doc.phone;
        delete response._doc.isAdmin;
        delete response._doc.createdAt;
        delete response._doc.updatedAt;
        delete response._doc.savedNews;
        delete response._doc.email;
        delete response._doc.sharedNews;

        const res_user = {
          ...response._doc,
          followersCount: followers_count,
          followingCount: following_count,
          sharedNewsCount: shared_news_count,
        };

        return res.status(httpStatus.OK).send({ user: res_user, success: true });
      })
      .catch((err) => {
        next(err);
      });
  }

  delete(req, res, next) {
    UserService.delete(req.params.id)
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({
            message: "Böyle bir kullanıcı bulunamadı!",
          });
        }
        return res.status(httpStatus.OK).send({
          message: "Kullanıcı silindi!",
          user: response,
          success: true,
        });
      })
      .catch((err) => {
        next(err);
      });
  }

  login(req, res, next) {
    req.body.password = passwordToHash(req.body.password);
    UserService.findOne(req.body)
      .then((user) => {
        if (!user) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Email veya şifre hatalı!", success: false });
        }

        user = {
          user_id: user._id,
          tokens: {
            access_token: generateAccessToken({ user_id: user._id, isAdmin: user.isAdmin }),
          },
        };

        delete user.password;
        return res.status(httpStatus.OK).send({ user: user, success: true });
      })
      .catch((err) => {
        next(err);
      });
  }

  updateProfileImage(req, res, next) {
    if (!req.files.profile_image) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "Profil güncellenemedi! Lütfen fotoğraf yükleyiniz!",
      });
    }

    const extension = path.extname(req.files.profile_image.name);
    const fileName = `${req.user_id}${extension}`;
    const folderPath = path.join(__dirname, "../", "uploads/users", fileName);

    req.files.profile_image.mv(folderPath, (err) => {
      if (err) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Profil resmi yükleme sırasında hata oluştu!",
          error: err,
        });
      }

      UserService.update(req.user_id, { profile_image: fileName })
        .then((response) => {
          return res.status(httpStatus.OK).send({
            message: "Profil resmi başarıyla güncellendi.",
            imagePath: response.profile_image,
            success: true,
          });
        })
        .catch((err) => {
          next(err);
        });
    });
  }

  follow(req, res, next) {
    UserService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!" });
        }

        const user = {
          date: new Date(),
          user_id: req.user_id,
        };

        const followersUserIdList = response.followers.map((x) => x.user_id.toString());

        if (!followersUserIdList.includes(req.user_id.toString())) {
          response.followers.push(user);
          res.status(httpStatus.OK).send({ message: "Takip Edildi.", success: true });
        } else {
          res.status(httpStatus.FORBIDDEN).send({ message: "Zaten Takip Ediyorsunuz!", success: false });
        }

        response.save();

        UserService.findOne({ _id: req.user_id })
          .then((response) => {
            if (!response) {
              return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!" });
            }

            const user = {
              date: new Date(),
              user_id: req.params.id,
            };
            const followingUserIdList = response.following.map((x) => x.user_id.toString());

            if (!followingUserIdList.includes(req.user_id.toString())) {
              response.following.push(user);
            }

            response.save();
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  unfollow(req, res, next) {
    UserService.findOne({ _id: req.params.id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!" });
        }

        response.followers = response.followers.filter((f) => f.user_id.toString() !== req.user_id);

        response.save();

        UserService.findOne({ _id: req.user_id })
          .then((response) => {
            if (!response) {
              return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!" });
            }

            response.following = response.following.filter((f) => f.user_id.toString() !== req.params.id);

            response
              .save()
              .then((response) => {
                return res.status(httpStatus.OK).send({ unfollow: response, message: "Takipten çıktı!", success: true });
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

  resetPassword(req, res, next) {
    const newPassword = new Date().getTime();
    UserService.updateWhere({ email: req.body.email }, { password: passwordToHash(newPassword) })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!" });
        }

        eventEmitter.emit("send_email", {
          to: response.email,
          subject: "Şifre Sıfırlama",
          html: `<td class="esd-stripe es-stripe-html" style="background-color: #fafafa;" bgcolor="#fafafa" align="center">
          <table class="es-content-body" style="background-color: #ffffff;" width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
              <tbody>
                  <tr>
                      <td class="esd-structure es-p40t es-p20r es-p20l" style="background-color: transparent;" bgcolor="transparent" align="left">
                          <table width="100%" cellspacing="0" cellpadding="0">
                              <tbody>
                                  <tr>
                                      <td class="esd-container-frame" width="560" valign="top" align="center">
                                          <table style="background-position: left top;" width="100%" cellspacing="0" cellpadding="0">
                                              <tbody>
                                                  <tr>
                                                      <td class="esd-block-image es-p5t es-p5b" align="center" style="font-size:0"><a target="_blank"><img src="http://localhost:3000/uploads/logos/gaste-logo.png" alt style="display: block;" width="175"></a></td>
                                                  </tr>
                                                  <br/>
                                                  <tr>
                                                      <td class="esd-block-text es-p15t es-p15b" align="center">
                                                          <br/>
                                                          <h1 style="color: #333333; font-size: 20px;"><strong style="background-color: transparent;">ŞİFRENİZİ Mİ UNUTTUNUZ?</strong></h1>
                                                      </td>
                                                  </tr>
                                                  <tr>
                                                      <td class="esd-block-text es-p40r es-p40l" align="center">
                                                          <p>Merhaba, ${response.full_name}</p>
                                                      </td>
                                                  </tr>
                                                  <tr>
                                                      <td class="esd-block-text es-p35r es-p40l" align="left">
                                                          <p style="text-align: center;">Şifre sıfırlama işlemi gerçekleştirildi!</p>
                                                      </td>
                                                  </tr>
                                                  <tr>
                                                      <td class="esd-block-text es-p25t es-p40r es-p40l" align="center">
                                                          <p> <strong>Dikkat!</strong> Şifrenizi sıfırlama işleminden sonra değiştirmeyi unutmayınız!</p>
                                                      </td>
                                                  </tr>
                                                  <tr>
                                                      <td class="esd-block-button es-p40t es-p40b es-p10r es-p10l" align="center"><span class="es-button-border"><a href="#" class="es-button" target="_blank">Yeni Şifreniz : ${newPassword}</a></span></td>
                                                  </tr>
                                              </tbody>
                                          </table>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </td>
                  </tr>
              </tbody>
          </table>
      </td>`,
        });

        return res.status(httpStatus.OK).send({
          message: "Şifre sıfırlama için Gaste'ye üye olduğunuz e-posta adresine bilgileri ilettik. Haberle kalın",
          success: true,
        });
      })
      .catch((err) => {
        next(err);
      });
  }

  searchUser(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    UserService.list(page, limit, { username: { $regex: ".*" + req.query.username + ".*" } })
      .then((response) => {
        if (!response.length) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Aradığınız kullanıcı bulunamadı", success: false });
        }

        response = response.filter((a) => a.isAdmin !== true);
        return res.status(httpStatus.OK).send(response);
      })
      .catch((err) => {
        next(err);
      });
  }

  getCurrentUser(req, res, next) {
    UserService.findOne({ _id: req.user_id })
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunamadı!", success: false });
        }
        const user_response = {
          _id: response._id,
          full_name: response.full_name,
          username: response.username,
          profile_image: response.profile_image,
          followingCount: response.following.length,
          followersCount: response.followers.length,
          sharedNewsCount: response.sharedNews.length,
        };

        return res.status(httpStatus.OK).send({ user: user_response, success: true });
      })
      .catch((err) => {
        next(err);
      });
  }

  getCurrentUserFollowers(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    UserService.findOne({ _id: req.user_id })
      .then((response) => {
        UserService.list(page, limit, { _id: { $in: response.followers.map((x) => x.user_id) } })
          .then((response) => {
            if (!response.length) {
              return res.status(httpStatus.NOT_FOUND).send({ message: "Takipçi bulunamadı!", success: false });
            }

            return res.status(httpStatus.OK).send({ followers: response, success: true });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  getCurrentUserFollowing(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    UserService.findOne({ _id: req.user_id })
      .then((response) => {
        UserService.list(page, limit, { _id: { $in: response.following.map((x) => x.user_id) } })
          .then((response) => {
            if (!response.length) {
              return res.status(httpStatus.NOT_FOUND).send({ message: "Takip edilen kimse bulunamadı!", success: false });
            }

            return res.status(httpStatus.OK).send({ following: response, success: true });
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  }

  saveSharedNews(data, req, res, next) {
    UserService.findById(req.user_id)
      .then((response) => {
        if (!response) {
          return res.status(httpStatus.NOT_FOUND).send({ message: "Kullanıcı bulunamadı!", success: false });
        }

        const shared_news_res = {
          _id: data.news_id,
        };

        response.sharedNews.push(shared_news_res);
        response.save();
      })
      .catch((err) => {
        next(err);
      });
  }

  removeSharedNews(data, req, res, next) {
    UserService.findById(req.user_id)
      .then((response) => {
        if (!response) {
          res.status(httpStatus.NOT_FOUND).send({ message: "Kullanıcı bulunamadı!", success: false });
        }
        response.sharedNews = response.sharedNews.filter((x) => x._id.toString() !== data);
        response.save();
      })
      .catch((err) => {
        next(err);
      });
  }
}

module.exports = new User();
