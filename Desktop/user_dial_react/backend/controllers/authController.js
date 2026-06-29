const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function resolveAccountRole(userLevel, userGroup) {
    const level = String(userLevel ?? "").trim().toLowerCase();
    const group = String(userGroup ?? "").trim().toUpperCase();

    if (level === "admin" || level === "2" || group === "ADMINS") {
        return "admin";
    }

    return "agent";
}


function buildAuthUser(dbUser) {
    const userLevel = String(dbUser.user_level ?? dbUser.userLevel ?? "1");
    const userGroup = dbUser.user_group ?? dbUser.userGroup ?? "AGENTS";

    return {
        id: dbUser.id,
        userNumber: dbUser.user_number ?? dbUser.userNumber,
        name: dbUser.name,
        email: dbUser.email,

        phoneLogin: dbUser.phone_login,
        phonePass: dbUser.phone_pass,

        lastLogin: dbUser.last_login,
        failedLoginCount: dbUser.failed_login_count,
        accountLocked: dbUser.account_locked,

        userLevel,
        userGroup,
        role: resolveAccountRole(userLevel, userGroup),
    };
}

function createAuthToken(user) {
    return jwt.sign(
        {
            id: user.id,
            userLevel: user.userLevel,
            userGroup: user.userGroup,
            role: user.role,
            userNumber: user.userNumber,
        },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: "1d" }
    );
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
        // Admin bypass
        // if (cleanUsername === "admin" && cleanPassword === "Admin@123") {
        //     const user = {
        //         id: 0,
        //         name: "Super Admin",
        //         email: "admin@system.local",
        //         userLevel: "admin",
        //         userGroup: "ADMINS",
        //         role: "admin",
        //     };

        //     return res.json({
        //         success: true,
        //         token: createAuthToken(user),
        //         user,
        //     });
        // }



        const sql = `
            SELECT * FROM users
            WHERE email = ? OR LOWER(user_number) = ? OR user_number = ?
        `;
        const [rows] = await db.query(sql, [cleanUsername, cleanUsername, username.trim()]);

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }
        const user = rows[0];

        // if (user.account_locked === "Y") {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Account locked. Contact administrator."
        //     });
        // }

        if (user.status && user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Account is inactive."
            });
        }

        let isMatch = false;

        if (user.password?.startsWith("$2")) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = password === user.password;
        }

        if (!isMatch) {

            await db.query(
                `UPDATE users
         SET failed_login_count = failed_login_count + 1
         WHERE id = ?`,
                [user.id]
            );

            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        await db.query(
            `UPDATE users
     SET
     last_login = NOW(),
     failed_login_count = 0
     WHERE id = ?`,
            [user.id]
        );
        const authUser = buildAuthUser(user);
        return res.json({
            success: true,
            token: createAuthToken(authUser),
            user: authUser,
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};

// exports.signup = async (req, res) => {
//     const { userNumber, fullName, mobile, email, password, accountType = "agent" } = req.body;

//     if (!userNumber || !fullName || !mobile || !email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: "All fields are required."
//         });
//     }

//     const normalizedAccountType = String(accountType).trim().toLowerCase();
//     if (!["agent", "admin"].includes(normalizedAccountType)) {
//         return res.status(400).json({
//             success: false,
//             message: "Invalid account type. Choose agent or admin."
//         });
//     }

//     const userLevel = normalizedAccountType === "admin" ? "2" : "1";
//     const userGroup = normalizedAccountType === "admin" ? "ADMINS" : "AGENTS";
//     const accountRole = normalizedAccountType === "admin" ? "admin" : "agent";

//     if (String(fullName).trim().length < 3) {
//         return res.status(400).json({ success: false, message: "Full Name must be at least 3 characters." });
//     }
//     if (!/^[a-zA-Z\s'\-\.]+$/.test(String(fullName).trim())) {
//         return res.status(400).json({ success: false, message: "Full Name contains invalid characters." });
//     }
//     if (!/^[6-9]\d{9}$/.test(String(mobile).trim())) {
//         return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number." });
//     }
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
//         return res.status(400).json({ success: false, message: "Email must be a valid email address." });
//     }
//     if (String(password).length < 8) {
//         return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
//     }

//     const trimmedUserNumber = String(userNumber).trim().toLowerCase();
//     const trimmedEmail = String(email).trim().toLowerCase();

//     try {
//         const [numberRows] = await db.query(
//             "SELECT id FROM users WHERE user_number = ?",
//             [trimmedUserNumber]
//         );
//         if (numberRows.length > 0) {
//             return res.status(409).json({
//                 success: false,
//                 message: "User Number already exists."
//             });
//         }

//         const [emailRows] = await db.query(
//             "SELECT id FROM users WHERE email = ?",
//             [trimmedEmail]
//         );
//         if (emailRows.length > 0) {
//             return res.status(409).json({
//                 success: false,
//                 message: "Email already exists."
//             });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const sql = `
//          INSERT INTO users
// (
//   user_number,
//   password,
//   name,
//   mobile,
//   user_level,
//   user_group,
//   phone_login,
//   phone_pass,
//   email,
//   status,
//   campaign,
//   password_days,
//   failed_login_count,
//   account_locked,
//   agent_interface_options
// )
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const defaultAgentOptions = JSON.stringify({
//             AgentCallTheme: '1',
//             NextDial: 'NOT_ACTIVE',
//             DialFilter: 'auto',
//             AgentRecording: 'afterCall',
//             MuteRecording: 'afterCall',
//             SelectedLanguage: 'afterCall',
//             AfterCustomenrPhone: 'afterCall',
//             AfterCustomerphone: 'afterCall',
//             AfterCustomenrdata: 'afterCall',
//             ShiftEnforcementOverride: 'afterCall',
//             AgentCallLogView: 'afterCall',
//             CampaignHideCallLogOverride: 'afterCall',
//             AgentLeadSearchOverride: 'afterCall',
//             LeadFilter: 'afterCall',
//             PresetContactSearch: 'afterCall',
//             MaxInboundCalls: 'afterCall',
//             MaxManualDialHoppersCalls: 'afterCall',
//             MaxManualDialHoppersCallsPerHour: 'afterCall',
//             WrapSecondsOverride: 'afterCall',
//             AgentReadyMaxLogoutOverride: 'afterCall',
//             AdditionalStatusGroup: 'afterCall',
//             FilterMinimumSeconds: 'afterCall',
//             FailedLoginCount: 'afterCall',
//             FilterStatus: 'afterCall',
//             FailedInProgress: 'afterCall'
//         });

//         await db.query(sql, [
//             trimmedUserNumber,
//             hashedPassword,
//             String(fullName).trim(),
//             String(mobile).trim(),
//             userLevel,
//             userGroup,
//             trimmedUserNumber,   // phone_login
//             null,                // phone_pass
//             trimmedEmail,
//             "active",
//             "manual",
//             30,
//             0,                   // failed_login_count
//             "N",                 // account_locked
//             defaultAgentOptions
//         ]);

//         return res.json({
//             success: true,
//             message: normalizedAccountType === "admin"
//                 ? "Admin account created successfully!"
//                 : "Agent account created successfully!",
//             accountType: normalizedAccountType,
//             role: accountRole,
//             userLevel,
//             userGroup,
//         });
//     } catch (err) {
//         console.error("Signup error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to sign up. Please try again."
//         });
//     }
// };