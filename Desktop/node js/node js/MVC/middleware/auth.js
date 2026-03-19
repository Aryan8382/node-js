const auth = (req, res, next) => {
    console.log(req.user)
    if (req.user.role !== "admin") {
        return res.status(403).send("Access denied: Not an admin");
    } else {
        next();
    }
};

module.exports = auth;