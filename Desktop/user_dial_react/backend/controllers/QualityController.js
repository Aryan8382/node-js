const db = require("../config/db");

// Campaigns
const getCampaigns = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM campaigns ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
};

// Lists
const getLists = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        list_id,
        list_name,
        active,
        campaign_id,
        list_description
      FROM lists
      ORDER BY list_id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
};

exports.deleteList = async (req, res) => {
  try {
    const { listId } = req.params;

    const [result] = await db.query(
      "DELETE FROM lists WHERE list_id = ?",
      [listId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "List not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "List deleted successfully",
    });
  } catch (error) {
    console.error("Delete List Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete list",
    });
  }
};

const createList = async (req, res) => {
  try {
    const { list_id, list_name, list_description, campaign_id } = req.body;
    if (!list_id || !list_name) {
      return res.status(400).json({ message: "List ID and List name are required" });
    }
    await db.query(
      `INSERT INTO lists (list_id, list_name, list_description, campaign_id, active)
       VALUES (?, ?, ?, ?, 'Y')`,
      [list_id, list_name, list_description || '', campaign_id || '']
    );
    res.status(201).json({ message: "List created successfully" });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "List ID already exists" });
    }
    res.status(500).json({ message: "Database Error" });
  }
};

const updateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const updateFields = { ...req.body };
    delete updateFields.list_id; // don't update primary key

    if (!updateFields.list_name) {
      return res.status(400).json({ message: "List name is required" });
    }

    const setClause = [];
    const values = [];

    for (const [key, value] of Object.entries(updateFields)) {
      setClause.push(`${key} = ?`);
      values.push(value === '' ? null : value);
    }
    values.push(listId);

    if (setClause.length === 0) {
       return res.status(400).json({ message: "No fields to update" });
    }

    const query = `UPDATE lists SET ${setClause.join(', ')} WHERE list_id = ?`;
    
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "List not found" });
    }
    res.json({ message: "List updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database Error" });
  }
};

const getListById = async (req, res) => {
  try {
    const { listId } = req.params;
    const [rows] = await db.query("SELECT * FROM lists WHERE list_id = ?", [listId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "List not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database Error" });
  }
};

const getIngroups = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM inbound_groups ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
};

// Scorecards
const getScorecards = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM quality_control_scorecards"
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
};

// ─── Copy List ───────────────────────────────────────────────────────────────
const copyList = async (req, res) => {
  const { sourceListId, ...overrides } = req.body;

  if (!sourceListId) {
    return res.status(400).json({ message: "Source List is required." });
  }

  try {
    // 1. Fetch source list (all columns)
    const [sourceRows] = await db.query("SELECT * FROM lists WHERE list_id = ?", [sourceListId]);
    if (sourceRows.length === 0) {
      return res.status(404).json({ message: "Source list not found." });
    }
    const source = sourceRows[0];

    // 2. New list_id and list_name are required
    const newListId   = overrides.list_id;
    const newListName = overrides.list_name;

    if (!newListId || !newListName) {
      return res.status(400).json({ message: "New List ID and List Name are required." });
    }

    // 3. Check uniqueness of new list_id
    const [existing] = await db.query("SELECT list_id FROM lists WHERE list_id = ?", [newListId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "List ID already exists." });
    }

    // 4. Build merged record — copy every column from source, override where provided
    const merged = { ...source };
    delete merged.id; // drop auto-increment surrogate if present

    // Apply overrides
    merged.list_id          = newListId;
    merged.list_name        = newListName;
    merged.list_description = overrides.list_description !== undefined ? overrides.list_description : source.list_description;
    merged.campaign_id      = overrides.campaign_id      !== undefined ? overrides.campaign_id      : source.campaign_id;
    merged.active           = overrides.active           !== undefined ? overrides.active           : source.active || 'Y';

    // 5. Dynamic INSERT from merged keys
    const columns = Object.keys(merged);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => merged[col] === '' ? null : merged[col]);

    const sql = `INSERT INTO lists (${columns.join(', ')}) VALUES (${placeholders})`;
    await db.query(sql, values);

    res.status(201).json({ message: "List copied successfully." });
  } catch (error) {
    console.error("Copy List Error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "List ID already exists." });
    }
    res.status(500).json({ message: error.sqlMessage || error.message || "Failed to copy list." });
  }
};

module.exports = {
  getCampaigns,
  getLists,
  getListById,
  createList,
  updateList,
  deleteList: exports.deleteList,
  copyList,
  getIngroups,
  getScorecards,
};