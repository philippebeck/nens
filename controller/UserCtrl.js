"use strict";

const bcrypt      = require("bcrypt");
const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const USERS_IMG   = process.env.IMG_URL + "users/";
const USERS_THUMB = process.env.THUMB_URL + "users/";

const form = formidable({ uploadDir: USERS_IMG, keepExtensions: true });
const User = db.user;

//! ******************** UTILS ********************

/**
 * ? CHECK USER DATA
 * * Validates user data & returns a JSON response with an error message if any validation fails.
 *
 * @param {string} name - The user's name.
 * @param {string} email - The user's email.
 * @param {string} role - The user's role.
 * @param {object} res - The response object.
 * @return {object} - JSON response with an error message if any validation fails.
 */
exports.checkUserData = (name, email, role, res) => {
  const MAX = process.env.STRING_MAX;
  const MIN = process.env.STRING_MIN;

  let alert = "";

  if (!nem.checkRange(role, MIN, MAX)) alert = process.env.CHECK_ROLE;
  if (!nem.checkEmail(email)) alert = process.env.CHECK_EMAIL;
  if (!nem.checkRange(name, MIN, MAX)) alert = process.env.CHECK_NAME;

  if (alert !== "") return res.status(403).json({ message: alert });
}

/**
 * ? CHECK USER PASSWORD
 * * Checks if the user password is valid.
 *
 * @param {string} pass - The user password to be checked.
 * @param {object} res - The response object.
 * @return {object} - The response object with an error message if the password is invalid.
 */
exports.checkUserPass = (pass, res) => {
  if (!nem.checkPass(pass)) return res.status(403).json({ message: process.env.CHECK_PASS });
}

/**
 * ? CHECK USER UNIQUE
 * * Checks if the given user's name & email are unique.
 *
 * @param {string} name - The name to check against the user's name.
 * @param {string} email - The email to check against the user's email.
 * @param {object} user - The user object to compare against.
 * @param {object} res - The response object to send the result to.
 * @return {object} The JSON response containing the error message if the name or email is not unique.
 */
exports.checkUserUnique = (name, email, user, res) => {
  if (user.name === name) return res.status(403).json({ message: process.env.DISPO_NAME });
  if (user.email === email) return res.status(403).json({ message: process.env.DISPO_EMAIL });
}

//! ******************** PUBLIC ********************

/**
 * ? CREATE USER
 * * Creates a new user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the user was created.
 * @throws {Error} If the user is not created.
 */
exports.createUser = (req, res, next) => {
  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    this.checkUserData(fields.name, fields.email, fields.role, res);
    this.checkUserPass(fields.pass, res);

    User
      .findAll()
      .then((users) => {
        for (let user of users) { this.checkUserUnique(fields.name, fields.email, user, res) }

        let image = nem.getName(fields.name) + "." + process.env.IMG_EXT;
        nem.setThumbnail("users/" + files.image.newFilename, USERS_THUMB + image);

        bcrypt
          .hash(fields.pass, 10)
          .then((hash) => {
            let user = {
              name: fields.name,
              email: fields.email,
              image: image,
              pass: hash,
              role: fields.role
            }

            User
              .create(user)
              .then(() => {
                fs.unlink(USERS_IMG + files.image.newFilename, () => { res.status(201).json({ message: process.env.USER_CREATED }) })
              })
              .catch(() => res.status(400).json({ message: process.env.USER_NOT_CREATED }));

          })
          .catch(() => res.status(400).json({ message: process.env.USER_NOT_PASS }));
      })
      .catch(() => { res.status(404).json({ message: process.env.USERS_NOT_FOUND }) });
  });
}

/**
 * ? SEND USER MESSAGE
 * * Sends a message.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 */
exports.sendMessage = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const mailer  = nem.getMailer();
    fields.html   = `<p>${fields.html}</p>`;

    (async function () {
      try {
        let mail = nem.getMessage(fields);

        await mailer.sendMail(mail, function () {
          res.status(202).json({ message: process.env.USER_MESSAGE });
        });
      } catch (e) { console.error(e); }
    })();
  })
}

//! ******************** PRIVATE ********************

/**
 * ? LIST ALL USERS WITHOUT PASSWORD
 * * Retrieves the list of users.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of users in JSON format.
 * @throws {Error} If the users are not found in the database.
 */
exports.listUsers = (req, res) => {
  User
    .findAll()
    .then((users) => {
      let usersList = [];

      for (let user of users) {
        let userSafe = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          created: user.created,
          updated: user.updated,
        };

        usersList.push(userSafe);
      }
      res.status(200).json(usersList);
    })
    .catch(() => res.status(404).json({ message: process.env.USERS_NOT_FOUND }));
}

/**
 * ? READ A USER
 * * Retrieves a user by their ID & sends a JSON response.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {object} The user data in JSON format.
 * @throws {Error} If the user is not found in the database.
 */
exports.readUser = (req, res) => {
  User
    .findByPk(parseInt(req.params.id))
    .then((user) => res.status(200).json(user))
    .catch(() => res.status(404).json({ message: process.env.USER_NOT_FOUND }));
}

/**
 * ? UPDATE USER
 * * Updates a user based on the provided request data.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {undefined} This function does not return anything.
 * @throws {Error} If the user is not updated in the database.
 */
exports.updateUser = (req, res, next) => {
  const id = parseInt(req.params.id);

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    this.checkUserData(fields.name, fields.email, fields.role, res);

    User
      .findAll()
      .then((users) => {
        for (let user of users) {
          if (user.id !== id) this.checkUserUnique(fields.name, fields.email, user, res);
        }

        let image = nem.getName(fields.name) + "." + process.env.IMG_EXT;
        if (files.image) nem.setThumbnail("users/" + files.image.newFilename, USERS_THUMB + image);

        if (fields.pass) {
          this.checkUserPass(fields.pass, res);

          bcrypt
            .hash(fields.pass, 10)
            .then((hash) => {
              let user = {
                name: fields.name,
                email: fields.email,
                image: image,
                pass: hash,
                role: fields.role
              }

              User
                .update(user, { where: { id: id }})
                .then(() => {
                  if (files.image) fs.unlink(USERS_IMG + files.image.newFilename, () => { });
                  res.status(200).json({ message: process.env.USER_UPDATED });
                })
                .catch(() => res.status(400).json({ message: process.env.USER_NOT_UPDATED }));
            })
            .catch(() => res.status(400).json({ message: process.env.USER_NOT_PASS }));

        } else {
          let user = {
            name: fields.name,
            email: fields.email,
            image: image,
            role: fields.role
          }

          User
            .update(user, { where: { id: id }})
            .then(() => {
              if (files.image) fs.unlink(USERS_IMG + files.image.newFilename, () => { });
              res.status(200).json({ message: process.env.USER_UPDATED });
            })
            .catch(() => res.status(400).json({ message: process.env.USER_NOT_UPDATED }));
        }
      })
      .catch(() => res.status(404).json({ message: process.env.USERS_NOT_FOUND }));
  })
}

/**
 * ? DELETE USER
 * * Deletes a user and associated comments & reviews from the database.
 *
 * @param {Object} req - The request object containing the user id in the params.
 * @param {Object} res - The response object to send the result.
 * @return {Object} The response object with a status & JSON message indicating success or failure.
 * @throws {Error} If the user is not deleted from the database.
 */
exports.deleteUser = (req, res) => {
  const id = parseInt(req.params.id);

  User
    .findByPk(id)
    .then(user => {
      fs.unlink(USERS_THUMB + user.image, () => {

        User
          .destroy({ where: { id: id }})
          .then(() => res.status(204).json({ message: process.env.USER_DELETED }))
          .catch(() => res.status(400).json({ message: process.env.USER_NOT_DELETED }))
      })
    })
    .catch(() => res.status(404).json({ message: process.env.USER_NOT_FOUND }));
}
