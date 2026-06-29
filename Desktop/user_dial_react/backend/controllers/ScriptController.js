const db = require("../config/db");

// ── GET all scripts ──────────────────────────────────────────
exports.getAllScripts = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                script_id,
                script_name,
                script_comments,
                script_text,
                active,
                user_group,
                script_color,
                modify_stamp
            FROM scripts
            ORDER BY script_id
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// ── GET single script ─────────────────────────────────────────
exports.getScript = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM scripts WHERE script_id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Script not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// ── POST create script ────────────────────────────────────────
exports.createScript = async (req, res) => {
    try {
        const {
            script_id,
            script_name,
            script_comments = "",
            script_text = "",
            active = "Y",
            user_group = "---ALL---",
            script_color = "",
        } = req.body;

        if (!script_id || !String(script_id).trim()) {
            return res.status(400).json({
                success: false,
                message: "script_id is required",
            });
        }

        if (!script_name || !String(script_name).trim()) {
            return res.status(400).json({
                success: false,
                message: "script_name is required",
            });
        }

        await db.query(
            `INSERT INTO scripts
                (script_id, script_name, script_comments, script_text, active, user_group, script_color)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                script_id.trim(),
                script_name.trim(),
                script_comments,
                script_text,
                active,
                user_group,
                script_color,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Script Created Successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// ── PUT update script ─────────────────────────────────────────
exports.updateScript = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Never allow updating PK or auto-stamp
        const NEVER_UPDATE = ["script_id", "modify_stamp"];
        NEVER_UPDATE.forEach((col) => delete updates[col]);

        const allowedColumns = [
            "script_name",
            "script_comments",
            "script_text",
            "active",
            "user_group",
            "script_color",
        ];

        const enumDefaults = {
            active: "Y",
        };

        const filteredUpdates = {};
        for (const col of allowedColumns) {
            if (updates[col] !== undefined) {
                if (enumDefaults[col] !== undefined && updates[col] === "") {
                    filteredUpdates[col] = enumDefaults[col];
                } else {
                    filteredUpdates[col] = updates[col];
                }
            }
        }

        const keys = Object.keys(filteredUpdates);

        if (keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update",
            });
        }

        const setClause = keys.map((key) => `${key} = ?`).join(", ");
        const values = keys.map((key) => filteredUpdates[key]);
        values.push(id);

        const sql = `UPDATE scripts SET ${setClause} WHERE script_id = ?`;

        console.log("Executing SQL:", sql);
        console.log("With Values:", values);

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Script not found",
            });
        }

        res.json({
            success: true,
            message: "Script Updated Successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE script ─────────────────────────────────────────────
exports.deleteScript = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM scripts WHERE script_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Script not found",
            });
        }

        res.json({
            success: true,
            message: "Script Deleted Successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
