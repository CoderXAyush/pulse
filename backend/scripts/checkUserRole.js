/**
 * Verify which role MongoDB has for an email (uses backend/.env MONGODB_URI).
 * Usage: node scripts/checkUserRole.js your@email.com
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { mongoUri } = require("../config/env");
const User = require("../models/User");

function maskUri(uri) {
  return uri.replace(/:([^:@]+)@/, ":****@");
}

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: node scripts/checkUserRole.js your@email.com");
    process.exit(1);
  }

  console.log("Connecting to:", maskUri(mongoUri));

  await mongoose.connect(mongoUri);
  const u = await User.findOne({ email });
  if (!u) {
    console.log("No user with that email in this database.");
    console.log("If you expected a match, the backend may be using a different MONGODB_URI than Compass.");
  } else {
    console.log({ email: u.email, role: u.role, name: u.name, organizationId: u.organizationId });
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
