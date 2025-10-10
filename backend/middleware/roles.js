
module.exports = (...allowedRoles) => (req, res, next) => {
  // Flatten the allowedRoles array in case it's nested
  const flattenedRoles = allowedRoles.flat();
  
  if (!req.user || !flattenedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied: insufficient role'
    });
  }
  next();
}; 