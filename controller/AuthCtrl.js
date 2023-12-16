"use strict";

const bcrypt      = require("bcrypt");
const db          = require("../model");
const formidable  = require("formidable");
const nem         = require("nemjs");
const Recaptcha   = require("google-recaptcha");

require("dotenv").config();

const { USER_NOT_FOUND } = process.env;

const form      = formidable();
const recaptcha = new Recaptcha({ secret: process.env.RECAPTCHA_SECRET });
const User      = db.user;

/**
 * ? READ AVATAR
 * * Retrieves the avatar information for a specific user.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {object} The avatar information for the user.
 * @throws {Error} If the user is not found in the database.
 */
exports.readAvatar = (req, res) => {
  User.findByPk(parseInt(req.params.id))
    .then((user) => { 
      const avatar = {
        name: user.name,
        image: user.image,
        role: user.role
      };
      res.status(200).json(avatar) 
    })
    .catch(() => res.status(404).json({ message: USER_NOT_FOUND }));
}

/**
 * ? CHECK RECAPTCHA
 * * Checks the validity of a recaptcha response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} The validity of the recaptcha response.
 * @throws {Error} If the recaptcha response is invalid.
 */
exports.checkRecaptcha = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const response = fields.response;
    const remoteIp = req.connection.remoteAddress;

    recaptcha.verify({ response, remoteIp }, (err, data) => {
      if (!err) res.send(data);
      else res.status(500).send(err);
    });
  })
}

/**
 * ? LOGIN USER
 * * Login a user.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @throws {Error} If the user is not found in the database.
 */
exports.loginUser = (req, res, next) => {
  const { AUTH_LOGIN } = process.env;

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }
    const { email, pass } = fields;

    User
      .findOne({ where: { email: email }})
      .then((user) => { nem.setAuth(pass, user, res) })
      .catch(() => res.status(401).json({ message: AUTH_LOGIN }));
  })
}

/**
 * ? FORGOT PASSWORD
 * * Handles the forgot password functionality.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the password was sent.
 * @throws {Error} If the user is not found in the database.
 */
exports.forgotPass = (req, res, next) => {
  const { AUTH_MESSAGE, CHECK_EMAIL, DISPO_EMAIL_REF, USER_NOT_PASS, USER_NOT_UPDATED } = process.env;

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const { email, html } = fields;
    const pass  = nem.getPassword();
    fields.html = `<p>${html}</p><b>${pass}</b>`;

    if (!nem.checkEmail(email)) return res.status(403).json({ message: CHECK_EMAIL });

    const mailer  = nem.getMailer();
    const mail    = nem.getMessage(fields);

    User
      .findOne({ where: { email: email }})
      .then((user) => {
        if (user !== null) {
          bcrypt
            .hash(pass, 10)
            .then((hash) => {
              const newUser = { ...user, pass: hash };

              User
                .update(newUser, { where: { id: user.id }})
                .then(() => { 
                  (async function(){
                    try {
                      await mailer.sendMail(mail, function() {res.status(202).json({ message: AUTH_MESSAGE })});
                    } catch(e){ console.error(e) }
                  })();
                })
                .catch(() => res.status(400).json({ message: USER_NOT_UPDATED }));
            })
            .catch(() => res.status(400).json({ message: USER_NOT_PASS }));
        } else {
          return res.status(403).json({ message: DISPO_EMAIL_REF });
        }
      })
      .catch(() => res.status(404).json({ message: USER_NOT_FOUND }));
  })
}
