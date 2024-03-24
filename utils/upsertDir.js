const upsertDir = (dirName) => {
  // Ensure the directory exists
  const uploadDir = path.join('public', dirName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

module.exports = { upsertDir };
