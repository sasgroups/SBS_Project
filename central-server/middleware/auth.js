const jwt = require("jsonwebtoken");

// Admin Auth Middleware
const requireAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Access denied, admin only" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};


// Kiosk/Auth Middleware
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { verifyToken, requireAdmin };
