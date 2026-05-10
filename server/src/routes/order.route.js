const express = require('express');
const { userMiddleware } = require('../middlewares');
const { getOrders, paymentIntent, updatePaymentStatus, getMyCompletedOrders } = require('../controllers/order.controller');
const app = express.Router();

app.get('/', userMiddleware, getOrders);

// Payment
app.post('/create-payment-intent/:_id', userMiddleware, paymentIntent);

// Payment confirm
app.patch('/', userMiddleware, updatePaymentStatus);

app.get('/my-completed-orders', userMiddleware, getMyCompletedOrders);

module.exports = app;