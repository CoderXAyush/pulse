const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Organization = require("../models/Organization");
const AppError = require("../utils/AppError");
const { jwtSecret, googleClientId } = require("../config/env");

const googleClient = new OAuth2Client(googleClientId);

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      organizationId: user.organizationId,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    avatar: user.avatar,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError("name, email and password are required", 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError("Email is already registered", 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const organization = await Organization.create({
      name: `${name}'s organization`,
    });

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
      organizationId: organization._id,
      role: "editor",
    });

    const token = signToken(user);

    res.status(201).json({
      status: "success",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("email and password are required", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Prevent password login for Google-only accounts
    if (user.authProvider === "google" && !user.password) {
      return next(
        new AppError("This account uses Google Sign-In. Please use the Google button to log in.", 400)
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password", 401));
    }

    const token = signToken(user);

    res.status(200).json({
      status: "success",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return next(new AppError("Google credential token is required", 400));
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return next(new AppError("Unable to retrieve email from Google account", 400));
    }

    // Try to find user by googleId first, then by email
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link Google account to existing local user
        user.googleId = googleId;
        user.authProvider = user.password ? user.authProvider : "google";
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      } else {
        const organization = await Organization.create({
          name: `${name}'s organization`,
        });
        user = await User.create({
          name,
          email: email.toLowerCase(),
          googleId,
          authProvider: "google",
          avatar: picture,
          organizationId: organization._id,
          role: "editor",
        });
      }
    } else {
      // Update avatar if changed
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
        await user.save();
      }
    }

    const token = signToken(user);

    res.status(200).json({
      status: "success",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.message?.includes("Token used too late") || error.message?.includes("Invalid token")) {
      return next(new AppError("Invalid or expired Google token. Please try again.", 401));
    }
    next(error);
  }
}

module.exports = {
  register,
  login,
  googleLogin,
};
