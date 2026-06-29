const db = require("../config/db");

// Get All Groups
exports.getAllGroups = async (req, res) => {
    try {
        const [rows] = await db.query(`
SELECT
    user_group,
    group_name,
    forced_timeclock_login
FROM user_groups
ORDER BY user_group
`);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to fetch user groups",
        });
    }
};

// Get Single Group
exports.getGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM user_groups WHERE user_group = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User Group not found",
            });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("DB ERROR in getGroup:", err);
        res.status(500).json({
            message: err.message,
        });
    }
};

// Create Group
exports.createGroup = async (req, res) => {
    try {
        const {
            user_group,
            group_name,
            forced_timeclock_login = "N",
        } = req.body;

        await db.query(
            `
      INSERT INTO user_groups
      (
        user_group,
        group_name,
        forced_timeclock_login
      )
      VALUES (?,?,?)
      `,
            [
                user_group,
                group_name,
                forced_timeclock_login,
            ]
        );

        res.status(201).json({
            success: true,
            message: "User Group Created",
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to create group",
        });
    }
};

// Update Group
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // 1. Allowed columns whitelist to prevent injection or schema mismatch
        const allowedColumns = [
            "group_name", "allowed_campaigns", "qc_allowed_campaigns", "qc_allowed_inbound_groups",
            "group_shifts", "forced_timeclock_login", "shift_enforcement", "agent_status_viewable_groups",
            "agent_status_view_time", "agent_call_log_view", "agent_xfer_consultative", "agent_xfer_dial_override",
            "agent_xfer_vm_transfer", "agent_xfer_blind_transfer", "agent_xfer_dial_with_customer",
            "agent_xfer_park_customer_dial", "agent_fullscreen", "allowed_reports", "webphone_url_override",
            "webphone_systemkey_override", "webphone_dialpad_override", "admin_viewable_groups",
            "admin_viewable_call_times", "allowed_custom_reports", "agent_allowed_chat_groups",
            "agent_xfer_park_3way", "admin_ip_list", "agent_ip_list", "api_ip_list", "webphone_layout",
            "allowed_queue_groups", "reports_header_override", "admin_home_url", "script_id"
        ];

        // 2. Default values for ENUM fields to prevent DB errors on empty strings
        const enumDefaults = {
            forced_timeclock_login: 'N',
            shift_enforcement: 'OFF',
            agent_status_view_time: 'N',
            agent_call_log_view: 'N',
            agent_xfer_consultative: 'Y',
            agent_xfer_dial_override: 'Y',
            agent_xfer_vm_transfer: 'Y',
            agent_xfer_blind_transfer: 'Y',
            agent_xfer_dial_with_customer: 'Y',
            agent_xfer_park_customer_dial: 'Y',
            agent_fullscreen: 'N',
            webphone_dialpad_override: 'DISABLED',
            agent_xfer_park_3way: 'Y',
            reports_header_override: 'DISABLED'
        };

        const filteredUpdates = {};
        for (const col of allowedColumns) {
            if (updates[col] !== undefined) {
                // Fix invalid empty strings for ENUMs
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

        const setClause = keys.map(key => `${key} = ?`).join(", ");
        const values = keys.map(key => filteredUpdates[key]);
        values.push(id);

        const sql = `UPDATE user_groups SET ${setClause} WHERE user_group = ?`;
        
        console.log("Executing SQL:", sql);
        console.log("With Values:", values);

        const [result] = await db.query(sql, values);

        // 3. Confirm that a row was actually updated
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User Group not found.",
            });
        }

        res.json({
            success: true,
            message: "User Group Updated Successfully",
        });

    } catch (err) {
        console.error("DB ERROR in updateGroup:", err);
        res.status(500).json({
            message: "Failed to update user group",
            error: err.message
        });
    }
};

// Delete Group
exports.deleteGroup = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(
            "DELETE FROM user_groups WHERE user_group=?",
            [id]
        );

        res.json({
            success: true,
            message: "Deleted Successfully",
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Delete Failed",
        });
    }
};
