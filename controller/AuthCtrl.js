"use strict";

const bcrypt      = require("bcrypt");
const db          = require("../model");
const formidable  = require("formidable");
const nem         = require("nemjs");
const Recaptcha   = require("google-recaptcha");

require("dotenv").config();

const form      = formidable();
const recaptcha = new Recaptcha({ secret: process.env.RECAPTCHA_SECRET });
const User      = db.user;

/**
 * ? READ AVATAR
 * * Retrieves the avatar information for a specific user.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {object} The avatar information for the user.
 * @throws {Error} If the user is not found in the database.
 */
exports.readAvatar = (req, res) => {
  User
    .findByPk(parseInt(req.params.id))
    .then((user) => { 
      let avatar = {};

      avatar.name   = user.name;
      avatar.image  = user.image;
      avatar.role   = user.role;

      res.status(200).json(avatar) 
    })
    .catch(() => res.status(404).json({ message: process.env.USER_NOT_FOUND }));
}

/**
 * ? CHECK RECAPTCHA
 * * Checks the validity of a recaptcha response.
 *
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

      if (err) {
        res.status(500).send(err);
      } else {
        res.send(data);
      }
    });
  })
}

/**
 * ? LOGIN USER
 * * Login a user.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @throws {Error} If the user is not found in the database.
 */
exports.loginUser = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    User
      .findOne({ where: { email: fields.email }})
      .then((user) => { nem.setAuth(fields.pass, user, res) })
      .catch(() => res.status(401).json({ message: process.env.AUTH_LOGIN }));
  })
}

/**
 * ? FORGOT PASSWORD
 * * Handles the forgot password functionality.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the password was sent.
 * @throws {Error} If the user is not found in the database.
 */
exports.forgotPass = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    if (!nem.checkEmail(fields.email)) return res.status(403).json({ message: process.env.CHECK_EMAIL });

    User
      .findOne({ where: { email: fields.email }})
      .then((user) => {
        if (user !== null) {
          let pass    = nem.getPassword();
          fields.html = `<p>${fields.html}</p><b>${pass}</b>`;

          bcrypt
            .hash(pass, 10)
            .then((hash) => {
              let newUser = {
                name: user.name,
                email: user.email,
                image: user.image,
                pass: hash,
                role: user.role
              }

              User
                .update(newUser, { where: { id: user.id }})
                .then(() => { 
                  const mailer = nem.getMailer();
                  (async function(){
                    try {
                      let mail = nem.getMessage(fields);
                      await mailer.sendMail(mail, function() {
                        res.status(202).json({ message: process.env.AUTH_MESSAGE });
                      });
                    } catch(e){ console.error(e); }
                  })();
                })
                .catch(() => res.status(400).json({ message: process.env.USER_NOT_UPDATED }));
            })
            .catch(() => res.status(400).json({ message: process.env.USER_NOT_PASS }));

        } else {
          return res.status(403).json({ message: process.env.DISPO_EMAIL_REF });
        }
      })
      .catch(() => res.status(404).json({ message: process.env.USER_NOT_FOUND }));
  })
}
