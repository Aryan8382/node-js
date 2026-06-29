const db = require("../config/db");
const bcrypt = require("bcryptjs");


// ───────────────────────────────────────────────────────────────────

const isEmpty = (value) =>
    value === null || value === undefined || String(value).trim() === "";

const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const isValidName = (name) =>
    /^[a-zA-Z\s'\-\.]+$/.test(String(name).trim());

const isValidMobile = (mobile) =>
    /^[6-9]\d{9}$/.test(String(mobile).trim());

const defaultAgentInterfaceOptions = {
    AgentCallTheme: '1',
    NextDial: 'NOT_ACTIVE',
    DialFilter: 'auto',
    AgentRecording: 'afterCall',
    MuteRecording: 'afterCall',
    SelectedLanguage: 'afterCall',
    AfterCustomenrPhone: 'afterCall',
    AfterCustomerphone: 'afterCall',
    AfterCustomenrdata: 'afterCall',
    ShiftEnforcementOverride: 'afterCall',
    AgentCallLogView: 'afterCall',
    CampaignHideCallLogOverride: 'afterCall',
    AgentLeadSearchOverride: 'afterCall',
    LeadFilter: 'afterCall',
    PresetContactSearch: 'afterCall',
    MaxInboundCalls: 'afterCall',
    MaxManualDialHoppersCalls: 'afterCall',
    MaxManualDialHoppersCallsPerHour: 'afterCall',
    WrapSecondsOverride: 'afterCall',
    AgentReadyMaxLogoutOverride: 'afterCall',
    AdditionalStatusGroup: 'afterCall',
    FilterMinimumSeconds: 'afterCall',
    FailedLoginCount: 'afterCall',
    FilterStatus: 'afterCall',
    FailedInProgress: 'afterCall'
};

const parseAgentInterfaceOptions = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;

    try {
        return JSON.parse(value);
    } catch (err) {
        return {};
    }
};

const mergeAgentInterfaceOptions = (value) => ({
    ...defaultAgentInterfaceOptions,
    ...parseAgentInterfaceOptions(value)
});

const validateUserPayload = ({ userNumber, fullName, mobile, email, password, userLevel, userGroup, phoneLogin, passwordDays, requirePassword = true }) => {
    const errors = [];

    if (isEmpty(userNumber)) {
        errors.push("User Number is required.");
    }

    if (isEmpty(fullName)) {
        errors.push("Full Name is required.");
    } else if (String(fullName).trim().length < 3) {
        errors.push("Full Name must be at least 3 characters.");
    } else if (!isValidName(fullName)) {
        errors.push("Full Name contains invalid characters.");
    }

    if (isEmpty(mobile) || !isValidMobile(mobile)) {
        errors.push("Please enter a valid 10-digit Indian mobile number.");
    }

    if (isEmpty(email)) {
        errors.push("Email is required.");
    } else if (!isValidEmail(email)) {
        errors.push("Email must be a valid email address.");
    }

    if (requirePassword) {
        if (isEmpty(password)) {
            errors.push("Password is required.");
        } else if (String(password).length < 8) {
            errors.push("Password must be at least 8 characters.");
        }
    } else if (password !== undefined && password !== null && String(password).trim() !== "" && String(password).length < 8) {
        errors.push("Password must be at least 8 characters.");
    }

    if (isEmpty(userLevel)) {
        errors.push("User Level is required.");
    }

    if (isEmpty(userGroup)) {
        errors.push("User Group is required.");
    }

    if (isEmpty(phoneLogin)) {
        errors.push("Phone Login is required.");
    }

    if (isEmpty(passwordDays)) {
        errors.push("Change Password Days is required.");
    } else if (Number(passwordDays) <= 0) {
        errors.push("Change Password Days must be greater than 0.");
    }

    return errors;
};

const mapUserRow = (user) => ({
    id: user.id,
    userNumber: user.user_number,
    fullName: user.name,
    mobile: user.mobile,
    email: user.email,

    userNickname: user.user_nickname || "",
    userGroup: user.user_group,
    userLevel: user.user_level,

    phoneLogin: user.phone_login,
    phonePass: user.phone_pass || "",

    campaign: user.campaign || "",
    voicemailId: user.voicemail_id || "",
    userCode: user.user_code || "",

    passwordDays: user.password_days,

    territory: user.territory || "",
    userLocation: user.user_location || "",

    status: user.status || "active",

    lastLogin: user.last_login,
    failedLoginCount: user.failed_login_count || 0,
    accountLocked: user.account_locked || "N",

    agentInterfaceOptions: mergeAgentInterfaceOptions(
        user.agent_interface_options
    )
});

exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.json({ success: true, user: mapUserRow(rows[0]) });
    } catch (err) {
        console.error("DB ERROR (getUserById):", err.message || err);
        return res.status(500).json({ success: false, message: "Failed to fetch user." });
    }
};
exports.getQualityControl = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        qc_id,
        campaign_id,
        campaign_name,
        qc_statuses,
        qualifying_calls
      FROM quality_control
    `);

    res.json(rows);
  } catch (err) {
    console.error("QC ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quality data"
    });
  }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
 const {
    userNumber,
    fullName,
    mobile,
    email,
    password,
    userNickname,
    userGroup,
    userLevel,
    phoneLogin,
    phonePass,
    campaign,
    voicemailId,
    userCode,
    passwordDays,
    territory,
    userLocation,
    status,
    failedLoginCount,
    accountLocked,
    agentInterfaceOptions
} = req.body;

    const validationErrors = validateUserPayload({
        userNumber,
        fullName,
        mobile,
        email,
        password,
        userLevel,
        userGroup,
        phoneLogin,
        passwordDays,
        requirePassword: false
    });

    if (validationErrors.length > 0) {
        return res.status(400).json({ success: false, errors: validationErrors });
    }

    try {
        const [existingRows] = await db.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const existingUser = existingRows[0];

        const [emailRows] = await db.query(
            "SELECT id FROM users WHERE email = ? AND id <> ?",
            [email.trim(), id]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({ success: false, message: "This email is already in use by another user." });
        }

        const [numberRows] = await db.query(
            "SELECT id FROM users WHERE user_number = ? AND id <> ?",
            [userNumber.trim(), id]
        );

        if (numberRows.length > 0) {
            return res.status(409).json({ success: false, message: "This user number is already in use by another user." });
        }

        const passwordToStore = isEmpty(password) ? existingUser.password : await bcrypt.hash(password, await bcrypt.genSalt(10));
        const mergedAgentOptions = {
            ...mergeAgentInterfaceOptions(existingUser.agent_interface_options),
            ...parseAgentInterfaceOptions(agentInterfaceOptions)
        };
        const agentOptionsJson = JSON.stringify(mergedAgentOptions);

        const updateSql = `
            UPDATE users
SET
  user_number = ?,
  name = ?,
  mobile = ?,
  email = ?,
  password = ?,
  user_nickname = ?,
  user_group = ?,
  user_level = ?,
  phone_login = ?,
  phone_pass = ?,
  campaign = ?,
  voicemail_id = ?,
  user_code = ?,
  password_days = ?,
  territory = ?,
  user_location = ?,
  agent_interface_options = ?,
  status = ?,
  failed_login_count = ?,
  account_locked = ?
WHERE id = ?
        `;

       const [result] = await db.query(updateSql, [
    userNumber.trim(),
    fullName.trim(),
    mobile.trim(),
    email.trim(),
    passwordToStore,
    userNickname ? userNickname.trim() : null,
    userGroup.trim(),
    userLevel,
    phoneLogin.trim(),
    phonePass || null,
    campaign || null,
    voicemailId || null,
    userCode || null,
    Number(passwordDays),
    territory || null,
    userLocation || null,
    agentOptionsJson,
    status || "active",
    failedLoginCount || 0,
    accountLocked || "N",
    id
]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.json({ success: true, message: "User updated successfully." });
    } catch (err) {
        console.error("DB ERROR (updateUser):", err.message || err);
        return res.status(500).json({ success: false, message: "Failed to update user." });
    }
};
// ─── Controllers ─────────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM users");
     const mapped = rows.map(user => ({
    id: user.id,
    userNumber: user.user_number,
    fullName: user.name,
    mobile: user.mobile,
    email: user.email,  

    userLevel: user.user_level,
    userGroup: user.user_group,

    phoneLogin: user.phone_login,
    phonePass: user.phone_pass,

    campaign: user.campaign,

    status: user.status || "active",

    lastLogin: user.last_login,
    failedLoginCount: user.failed_login_count,
    accountLocked: user.account_locked
}));

        res.status(200).json(mapped);
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        res.status(500).json({ message: "Database error" });
    }
};

exports.createUser = async (req, res) => {
    const {
        userNumber,
        password,
        fullName,
        mobile,
        userLevel,
        userGroup,
        phoneLogin,
        phonePass,
        email,
        status,
        campaign,
        passwordDays,
        agentInterfaceOptions
    } = req.body;

    // ── 1. Validate payload ──────────────────────────────────────────────────
    const validationErrors = validateUserPayload({
        userNumber, fullName, mobile, email, password,
        userLevel, userGroup, phoneLogin, passwordDays
    });

    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            message: validationErrors[0],
            errors: validationErrors
        });
    }

    const trimmedUserNumber = String(userNumber).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    let hashedPassword = password;
    if (password) {
        try {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error hashing password." });
        }
    }

    try {
        // ── 2. Check duplicate userNumber ────────────────────────────────────
        const [numberRows] = await db.query(
            "SELECT id FROM users WHERE user_number = ?",
            [trimmedUserNumber]
        );

        if (numberRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User Number already exists. Please use a different User Number."
            });
        }

        // ── 3. Check duplicate email ─────────────────────────────────────────
        const [emailRows] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [trimmedEmail]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists. Please use a different email address."
            });
        }

        // ── 4. Insert user ──────────────────────────────────────────────────
        const sql = `
INSERT INTO users
(
    user_number,
    password,
    name,
    mobile,
    user_level,
    user_group,
    phone_login,
    phone_pass,
    email,
    status,
    campaign,
    password_days,
    failed_login_count,
    account_locked,
    agent_interface_options
)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

        const agentOptionsJson = JSON.stringify({
            ...defaultAgentInterfaceOptions,
            ...parseAgentInterfaceOptions(agentInterfaceOptions)
        });

        const [result] = await db.query(sql, [
            trimmedUserNumber,
            hashedPassword,
            String(fullName).trim(),
            String(mobile).trim(),
            userLevel,
            String(userGroup).trim(),
            String(phoneLogin).trim(),
            phonePass || null,
            trimmedEmail,
            status || "active",
            campaign || null,
            Number(passwordDays),
            0,
            "N",
            agentOptionsJson
        ]);

        if (result.affectedRows !== 1 || !result.insertId) {
            return res.status(500).json({
                success: false,
                message: "User insert did not complete."
            });
        }

        return res.status(201).json({
            success: true,
            id: result.insertId,
            affectedRows: result.affectedRows,
            message: "User created successfully."
        });
    } catch (err) {
        console.error("DB ERROR (createUser):", err.sqlMessage || err.message || err);
        return res.status(500).json({
            success: false,
            message: "Failed to create user. Please try again."
        });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error("DB ERROR (deleteUser):", err.sqlMessage || err.message || err);
        return res.status(500).json({
            success: false,
            message: "Delete failed"
        });
    }
};

// Bulk delete users by array of ids in request body: { ids: [1,2,3] }
exports.deleteUsers = async (req, res) => {
    const ids = req.body && req.body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: "No user ids provided." });
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM users WHERE id IN (${placeholders})`;

    try {
        const [result] = await db.query(sql, ids);
        res.json({ success: true, deleted: result.affectedRows });
    } catch (err) {
        console.error('DB ERROR (deleteUsers):', err.sqlMessage || err.message || err);
        return res.status(500).json({ success: false, message: 'Bulk delete failed.' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [[users]] = await db.query("SELECT COUNT(*) as total FROM users");
        const [[campaigns]] = await db.query("SELECT COUNT(*) as total FROM campaigns");
        const [[lists]] = await db.query("SELECT COUNT(*) as total FROM lists");
        const [[ingroups]] = await db.query("SELECT COUNT(*) as total FROM ingroups");
        const [[dids]] = await db.query("SELECT COUNT(*) as total FROM dids");

        res.json({
            users: users.total,
            campaigns: campaigns.total,
            lists: lists.total,
            ingroups: ingroups.total,
            dids: dids.total
        });
    } catch (err) {
        console.error("DB ERROR (getDashboardStats):", err.sqlMessage || err.message || err);
        return res.status(500).json({ success: false, message: "Failed to fetch dashboard stats." });
    }
};

// ─── Copy User ───────────────────────────────────────────────────────────────
exports.copyUser = async (req, res) => {
    const { sourceUserId, ...overrides } = req.body;

    if (!sourceUserId) {
        return res.status(400).json({ success: false, message: "Source User is required." });
    }

    try {
        // ── 1. Fetch source user ─────────────────────────────────────────────
        const [sourceRows] = await db.query("SELECT * FROM users WHERE id = ?", [sourceUserId]);
        if (sourceRows.length === 0) {
            return res.status(404).json({ success: false, message: "Source user not found." });
        }
        const source = sourceRows[0];

        // ── 2. Merge: source values as base, overrides win ───────────────────
        const userNumber  = overrides.userNumber  || source.user_number;
        const fullName    = overrides.fullName    || source.name;
        const mobile      = overrides.mobile      || source.mobile;
        const email       = overrides.email       || source.email;
        const password    = overrides.password;                          // always required for new user
        const userLevel   = overrides.userLevel   || source.user_level;
        const userGroup   = overrides.userGroup   || source.user_group;
        const phoneLogin  = overrides.phoneLogin  || source.phone_login;
        const phonePass   = overrides.phonePass   !== undefined ? overrides.phonePass : source.phone_pass;
        const campaign    = overrides.campaign    !== undefined ? overrides.campaign   : source.campaign;
        const voicemailId = overrides.voicemailId !== undefined ? overrides.voicemailId : source.voicemail_id;
        const userCode    = overrides.userCode    !== undefined ? overrides.userCode   : source.user_code;
        const passwordDays = overrides.passwordDays || source.password_days;
        const territory   = overrides.territory   !== undefined ? overrides.territory  : source.territory;
        const userLocation = overrides.userLocation !== undefined ? overrides.userLocation : source.user_location;
        const userNickname = overrides.userNickname !== undefined ? overrides.userNickname : source.user_nickname;
        const status      = overrides.status      || source.status || "active";

        // Merge agent interface options: source → overrides
        const agentInterfaceOptions = {
            ...mergeAgentInterfaceOptions(source.agent_interface_options),
            ...parseAgentInterfaceOptions(overrides.agentInterfaceOptions)
        };

        // ── 3. Validate merged payload ───────────────────────────────────────
        const validationErrors = validateUserPayload({
            userNumber, fullName, mobile, email, password,
            userLevel, userGroup, phoneLogin, passwordDays
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors[0],
                errors: validationErrors
            });
        }

        const trimmedUserNumber = String(userNumber).trim();
        const trimmedEmail = String(email).trim().toLowerCase();

        // ── 4. Check uniqueness ──────────────────────────────────────────────
        const [numberRows] = await db.query("SELECT id FROM users WHERE user_number = ?", [trimmedUserNumber]);
        if (numberRows.length > 0) {
            return res.status(409).json({ success: false, message: "User Number already exists." });
        }

        const [emailRows] = await db.query("SELECT id FROM users WHERE email = ?", [trimmedEmail]);
        if (emailRows.length > 0) {
            return res.status(409).json({ success: false, message: "Email already exists." });
        }

        // ── 5. Hash password ─────────────────────────────────────────────────
        let hashedPassword;
        try {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error hashing password." });
        }

        // ── 6. Insert copied user ────────────────────────────────────────────
        const sql = `
INSERT INTO users
(
    user_number, password, name, mobile,
    user_level, user_group, phone_login, phone_pass,
    email, status, campaign, voicemail_id, user_code,
    password_days, territory, user_location, user_nickname,
    failed_login_count, account_locked, agent_interface_options
)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;
        const agentOptionsJson = JSON.stringify(agentInterfaceOptions);

        const [result] = await db.query(sql, [
            trimmedUserNumber,
            hashedPassword,
            String(fullName).trim(),
            String(mobile).trim(),
            userLevel,
            String(userGroup).trim(),
            String(phoneLogin).trim(),
            phonePass || null,
            trimmedEmail,
            status,
            campaign || null,
            voicemailId || null,
            userCode || null,
            Number(passwordDays),
            territory || null,
            userLocation || null,
            userNickname || null,
            0,
            "N",
            agentOptionsJson
        ]);

    res.json({ success: true, id: result.insertId, message: "User copied successfully." });
    } catch (err) {
        console.error("DB ERROR (copyUser):", err.sqlMessage || err.message || err);
        return res.status(500).json({ success: false, message: err.sqlMessage || err.message || "Failed to copy user." });
    }
};
