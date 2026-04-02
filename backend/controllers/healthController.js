function getHealth(req, res) {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
