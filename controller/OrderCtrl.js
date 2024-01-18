"use strict";

const formidable  = require("formidable");
const db          = require("../model");

require("dotenv").config();

const { ORDERS_NOT_FOUND } = process.env;

const form  = formidable();
const Order = db.order;
const User  = db.user;

//! ******************** UTILS ********************

/**
 * ? SET MESSAGE
 * * Sets the message content for an order.
 * 
 * @param {number} total - The total amount of the order.
 * @param {string} paymentId - The ID of the payment.
 * @param {Array} products - An array of products in the order.
 * @return {Object} message - The message object containing subject, text & html.
 */
exports.setMessage = (total, paymentId, products) => {
  const { CURRENCY_SYMBOL, ORDER_LIST, ORDER_NAME, ORDER_PAYMENT, ORDER_PRICE, ORDER_QUANTITY, ORDER_SUBJECT, ORDER_TITLE, ORDER_TOTAL } = process.env;

  let message = {};
  message.subject = ORDER_SUBJECT;

  message.text = `
    <h1>${ORDER_TITLE}</h1>
    <p>
      ${ORDER_TOTAL} 
      <b>${total} ${CURRENCY_SYMBOL}</b>,
      ${ORDER_PAYMENT} 
      <b>#${paymentId}</b> !
    </p>
    <p>${ORDER_LIST}</p>`;

  products = JSON.parse(products);

  for (let product of products) {
    const { id, name, option, quantity, price } = product;

    message.products += `
      <ul>
        <li><i>id</i> : ${id}</li>
        <li><i>${ORDER_NAME}</i> : <b>${name}</b></li>
        <li><i>option</i> : <b>${option}</b></li>
        <li><i>${ORDER_QUANTITY}</i> : ${quantity}</li>
        <li><i>${ORDER_PRICE}</i> : ${price} ${CURRENCY_SYMBOL}</li>
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
exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.status(200).json(orders);

  } catch (error) {
    console.error(error);
    res.status(404).json({ message: ORDERS_NOT_FOUND });
  }
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
exports.listUserOrders = async (req, res) => {
  const ID = parseInt(req.params.id, 10);

  try {
    const orders = await Order.findAll({ where: { userId: ID }});
    res.status(200).json(orders);

  } catch (error) {
    console.error(error);
    res.status(404).json({ message: ORDERS_NOT_FOUND });
  }
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
exports.createOrder = async (req, res, next) => {
  const { getMailer, getMessage } = require("../middleware/getters");

  const { ORDER_CREATED, ORDER_MESSAGE, ORDER_NOT_CREATED, USER_NOT_FOUND } = process.env;

  form.parse(req, async (err, fields) => {
    if (err) { next(err); return }

    const { paymentId, products, total } = fields;
    let message = this.setMessage(total, paymentId, products);

    try {
      await Order.create(fields);

      const user = await User.findByPk(fields.userId);
      if (!user) return res.status(404).json({ message: USER_NOT_FOUND });

      message.email = user.email;
      const mailer  = getMailer();
      const mail    = getMessage(message);

      await mailer.sendMail(mail);
      res.status(202).json({ message: `${ORDER_CREATED} & ${ORDER_MESSAGE}` });

    } catch (error) {
      console.error(error);
      res.status(400).json({ message: ORDER_NOT_CREATED });
    }
  })
};

/**
 * ? UPDATE ORDER
 * * Updates an order.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @return {Object} A message indicating that the order was updated.
 * @throws {Error} If the order is not updated.
 */
exports.updateOrder = (req, res, next) => {
  const { ORDER_NOT_UPDATED, ORDER_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    Order.update(fields, { where: { id: ID }})
      .then(() => res.status(200).json({ message: ORDER_UPDATED }))
      .catch(() => res.status(400).json({ message: ORDER_NOT_UPDATED }));
  })
};

/**
 * ? DELETE ORDER
 * * Deletes an order by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the order was deleted.
 * @throws {Error} If the order is not deleted.
 */
exports.deleteOrder = async (req, res) => {
  const { ORDER_DELETED, ORDER_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);
  
  try {
    await Order.destroy({ where: { id: ID }});
    res.status(204).json({ message: ORDER_DELETED });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: ORDER_NOT_DELETED });
  }
};
