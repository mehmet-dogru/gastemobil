const BaseService = require("./BaseService");
const BaseModel = require("../models/News");

class NewsService extends BaseService {
  constructor() {
    super(BaseModel);
  }

  list(page, limit, where) {
    const allNews = BaseModel.find(where || {})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: "user_id",
        select: "full_name profile_image",
      });

    return allNews;
  }
}

module.exports = new NewsService();
