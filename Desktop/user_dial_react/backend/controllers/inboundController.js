// controllers/inboundController.js
// Handles CRUD operations for ingroups table.
const db = require('../config/db');
const validationResult = () => ({ isEmpty: () => true, array: () => [] });

// Helper to format success responses
const success = (res, data, message = 'Success') => {
  return res.json({ success: true, message, data });
};

// Helper to forward errors to centralized error handler
const handleError = (next, err) => {
  console.error(err);
  return next(err);
};

// GET /api/inbounds – fetch all records
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ingroups ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// GET /api/inbounds/:id – fetch a single record by id
exports.getOne = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ingroups WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ingroup record not found' });
    }
    return success(res, rows[0]);
  } catch (err) {
    return handleError(next, err);
  }
};

// POST /api/inbounds – create a new ingroup record
exports.create = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  const { groupId, groupName, qc_statuses, qualifying_calls } = req.body;
  try {
    const sql = `INSERT INTO ingroups (group_id, group_name, qc_statuses, qualifying_calls)
                 VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      groupId || null,
      groupName || null,
      qc_statuses || null,
      qualifying_calls || null,
    ]);
    const insertedId = result.insertId;
    const [newRows] = await db.query('SELECT * FROM ingroups WHERE id = ?', [insertedId]);
    return res.status(201).json({ success: true, message: 'Ingroup record created', data: newRows[0] });
  } catch (err) {
    return handleError(next, err);
  }
};

// PUT /api/inbounds/:id – update an existing record
exports.update = async (req, res, next) => {
  const { id } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  const { groupId, groupName, qc_statuses, qualifying_calls } = req.body;
  try {
    const sql = `UPDATE ingroups SET group_id = ?, group_name = ?, qc_statuses = ?, qualifying_calls = ?
                 WHERE id = ?`;
    const [result] = await db.execute(sql, [
      groupId || null,
      groupName || null,
      qc_statuses || null,
      qualifying_calls || null,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ingroup record not found' });
    }
    const [updatedRows] = await db.query('SELECT * FROM ingroups WHERE id = ?', [id]);
    return success(res, updatedRows[0], 'Ingroup record updated');
  } catch (err) {
    return handleError(next, err);
  }
};

// DELETE /api/inbounds/:id – delete a record
exports.remove = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM ingroups WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ingroup record not found' });
    }
    return res.json({ success: true, message: 'Ingroup record deleted' });
  } catch (err) {
    return handleError(next, err);
  }
};
