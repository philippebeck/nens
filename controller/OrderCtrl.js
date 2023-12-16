"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const nem         = require("nemjs");

require("dotenv").config();

const form  = formidable();
const Order = db.order;
const User  = db.user;

//! ******************** SETTERS ********************

/**
 * ? SET MAILER
 * * Sets the mailer and sends an email.
 *
 * @param {Object} fields - The fields used to generate the email message.
 * @param {Object} res - The response object used to send the HTTP response.
 * @return {Object} A message indicating that the email was sent.
 * @throws {Error} If an error occurs while sending the email.
 */
exports.setMailer = (fields, res) => {
  const mailer = nem.getMailer();

  (async function(){
    try {
      let mail = nem.getMessage(fields);

      await mailer.sendMail(mail, function() {
        res.status(202).json({ message: process.env.ORDER_MESSAGE });
      });
    } catch(e){ console.error(e); }
  })();
}

/**
 * ? SET MESSAGE
 * * Sets the message content for an order.
 *
 * @param {number} total - The total amount of the order.
 * @param {string} payment_id - The ID of the payment.
 * @param {Array} products - An array of products in the order.
 * @return {Object} message - The message object containing the subject, text, and html properties.
 */
exports.setMessage = (total, payment_id, products) => {
  let message = {};
  message.subject = process.env.ORDER_SUBJECT;

  message.text = `
    <h1>${process.env.ORDER_TITLE}</h1>
    <p>
      ${process.env.ORDER_TOTAL} 
      <b>${total} ${process.env.CURRENCY_SYMBOL}</b>,
      ${process.env.ORDER_PAYMENT} 
      <b>#${payment_id}</b> !
    </p>
    <p>${process.env.ORDER_LIST}</p>`;

  for (let product of products) {
    message.products += `
      <ul>
        <li><i>id</i> : ${product.id}</li>
        <li><i>${process.env.ORDER_NAME}</i> : <b>${product.name}</b></li>
        <li><i>option</i> : <b>${product.option}</b></li>
        <li><i>${process.env.ORDER_QUANTITY}</i> : ${product.quantity}</li>
        <li><i>${process.env.ORDER_PRICE}</i> : ${product.price} ${process.env.CURRENCY_SYMBOL}</li>
      </ul>`;
  }

  message.products  = message.products.split("undefined")[1];
  message.html      = message.text + message.products;

  return message;
}

//! ******************** PRIVATE ********************

/**
 * ? LIST ORDERS
 * * Retrieves a list of orders.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of orders.
 * @throws {Error} If the orders are not found in the database.
 */
exports.listOrders = (req, res) => {
  Order
    .findAll()
    .then((orders) => { res.status(200).json(orders) })
    .catch(() => res.status(404).json({ message: process.env.ORDERS_NOT_FOUND }));
};

/**
 * ? LIST USER ORDERS
 * * Retrieves a list of orders for a specific user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of user orders.
 * @throws {Error} If the orders are not found in the database.
 */
exports.listUserOrders = (req, res) => {
  Order
    .findAll({ where: { user_id: parseInt(req.params.id) }})
    .then((orders) => res.status(200).json(orders))
    .catch(() => res.status(404).json({ message: process.env.ORDERS_NOT_FOUND }));
};

/**
 * ? CREATE ORDER
 * * Creates an order based on the request data.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the order was created.
 * @throws {Error} If an error occurs while creating the order.
 */
exports.createOrder = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    let message = this.setMessage(fields.total, fields.payment_id, fields.products);

    Order
      .create(fields)
      .then(() => {
        User
          .findByPk(fields.user_id)
          .then((user) => {
            message.email = user.email;
            this.setMailer(message, res);
          })
          .catch(() => res.status(404).json({ message: process.env.USER_NOT_FOUND }));
      })
      .then(() => res.status(201).json({ message: process.env.ORDER_CREATED }))
      .catch(() => res.status(400).json({ message: process.env.ORDER_NOT_CREATED }));
  })
};

/**
 * ? UPDATE ORDER
 * * Updates an order.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @return {Object} A message indicating that the order was updated.
 * @throws {Error} If the order is not updated.
 */
exports.updateOrder = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    Order
      .update(fields, { where: { id: parseInt(req.params.id) }})
      .then(() => res.status(200).json({ message: process.env.ORDER_UPDATED }))
      .catch(() => res.status(400).json({ message: process.env.ORDER_NOT_UPDATED }));
  })
};

/**
 * ? DELETE ORDER
 * * Deletes an order.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the order was deleted.
 * @throws {Error} If the order is not deleted.
 */
exports.deleteOrder = (req, res) => {
  Order
    .destroy({ where: { id: parseInt(req.params.id) }})
    .then(() => res.status(204).json({ message: process.env.ORDER_DELETED }))
    .catch(() => res.status(400).json({ message: process.env.ORDER_NOT_DELETED }))
};
