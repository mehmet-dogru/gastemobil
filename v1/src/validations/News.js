const Joi = require("joi");

const createValidation = Joi.object({
  location: Joi.string().required().min(2).messages({
    "string.base": `Konum alanı String bir değer olmalıdır!`,
    "string.empty": `Konum alanı boş bırakılamaz!`,
    "string.min": `Konum en az {#limit} karakter olmalı!`,
    "any.required": `Konum alanı boş bırakılamaz!`,
  }),
  media: Joi.string().required().min(3).messages({
    "string.base": `Haber alanı String bir değer olmalıdır!`,
    "string.empty": `Haber alanı boş bırakılamaz!`,
    "string.min": `Haber en az {#limit} karakter olmalı!`,
    "any.required": `Haber alanı boş bırakılamaz!`,
  }),
  description: Joi.string().required().min(1).messages({
    "string.base": `Açıklama alanı String bir değer olmalıdır!`,
    "string.empty": `Açıklama alanı boş bırakılamaz!`,
    "string.min": `Açıklama en az {#limit} karakter olmalı!`,
    "any.required": `Açıklama alanı boş bırakılamaz!`,
  }),
});

const commentValidation = Joi.object({
  comment: Joi.string().min(1).messages({
    "string.base": `Yorum alanı String bir değer olmalıdır!`,
    "string.min": `Yorum en az {#limit} karakter olmalı!`,
    "string.empty": `Yorum alanı boş bırakılamaz!`,
  }),
});

module.exports = {
  createValidation,
  commentValidation,
};
