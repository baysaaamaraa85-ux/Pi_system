import jwt from 'jsonwebtoken';

// JWT token шалгах middleware
export const authenticate = (req, res, next) => {
  try {
    // Header-ээс token авах
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Нэвтрэх шаардлагатай' 
      });
    }

    const token = authHeader.substring(7); // "Bearer " хэсгийг хасах

    // Token баталгаажуулах
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Request объект дээр хэрэглэгчийн мэдээлэл хадгалах
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token-ий хугацаа дууссан' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Буруу token' 
    });
  }
};

// Тодорхой эрхтэй эсэхийг шалгах
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Нэвтрэх шаардлагатай' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Хандах эрхгүй байна' 
      });
    }

    next();
  };
};
