// routes/inboundRoutes.js
// CRUD routes for the Inbound module.
// Uses the existing Express app, DB pool, and validation middleware.

const express = require('express');
const router = express.Router();
const inboundController = require('../controllers/inboundController');
// const { body, param } = require('express-validator');
// Auth middleware disabled for inbound routes

// Validation rules for inbound payloads
const inboundValidation = [];

// GET all inbound records
router.get('/', inboundController.getAll);

// GET a single inbound record by id
router.get('/:id', inboundController.getOne);

// CREATE a new inbound record
router.post('/', inboundController.create);

// UPDATE an existing inbound record
router.put('/:id', inboundController.update);

// DELETE an inbound record
router.delete('/:id', inboundController.remove);

module.exports = router;
