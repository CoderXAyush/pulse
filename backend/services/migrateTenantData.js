const path = require("path");
const Organization = require("../models/Organization");
const User = require("../models/User");
const Video = require("../models/Video");

function extFromFilename(filename = "") {
  const ext = path.extname(filename).toLowerCase();
  return ext ? ext.slice(1) : "";
}

async function migrateTenantData() {
  const usersNeedingOrg = await User.find({
    $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
  });

  for (const user of usersNeedingOrg) {
    const org = await Organization.create({
      name: `${user.name}'s organization`,
    });
    user.organizationId = org._id;
    await user.save();
  }

  const videosNeedingOrg = await Video.find({
    $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
  });

  for (const video of videosNeedingOrg) {
    const owner = await User.findById(video.userId);
    if (owner?.organizationId) {
      video.organizationId = owner.organizationId;
    } else {
      const org = await Organization.create({ name: "Recovered uploads" });
      if (owner) {
        owner.organizationId = org._id;
        await owner.save();
      }
      video.organizationId = org._id;
    }
    if (!video.format && video.filename) {
      video.format = extFromFilename(video.filename);
    }
    await video.save();
  }

  const videosNeedingFormat = await Video.find({ $or: [{ format: "" }, { format: { $exists: false } }] });
  for (const video of videosNeedingFormat) {
    if (video.filename) {
      video.format = extFromFilename(video.filename);
      await video.save();
    }
  }

  const uploaderIds = await Video.distinct("userId");
  if (uploaderIds.length) {
    await User.updateMany(
      { _id: { $in: uploaderIds }, role: "viewer" },
      { $set: { role: "editor" } }
    );
  }
}

module.exports = { migrateTenantData };
