import jwt from 'jsonwebtoken';

// Common authentication middleware function
export const authenticate = (role, verifyAdmin = false) => {
  return async (req, res, next) => {
    // Check for the token in the headers: token, atoken, or dtoken
    const token = req.headers['token'] || req.headers['atoken'] || req.headers['dtoken'];
    
    if (!token) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      if (role === 'admin' && verifyAdmin) {
        // Admin-specific validation
        const adminCheck = process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD;
        if (decodedToken !== adminCheck) {
          return res.json({ success: false, message: 'Not Authorized, Login Again' });
        }
      } else if (role === 'user') {
        req.body.userId = decodedToken.id;
      } else if (role === 'doctor') {
        req.body.docId = decodedToken.id;
      }

      next();  // Continue to the next middleware or route
    } catch (error) {
      console.log(error);
      return res.json({ success: false, message: error.message });
    }
  };
};


// user authentication middleware
export const authUser = async (req, res, next) => {
    const { token } = req.headers
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = token_decode.id
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

    // doctor authentication middleware

}

export const authDoctor = async (req, res, next) => {
  const { dtoken } = req.headers
  if (!dtoken) {
      return res.json({ success: false, message: 'Not Authorized Login Again' })
  }
  try {
      const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
      req.body.docId = token_decode.id
      next()
  } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
  }
}

