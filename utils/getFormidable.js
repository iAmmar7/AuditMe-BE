const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

const getFormidable = (dirName) => {
  // Ensure the directory exists
  const uploadDir = path.join('public', dirName);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const formData = formidable({
    uploadDir: `./public/${dirName}`,
    keepExtensions: true,
    multiples: true,
  });

  return formData;
};

module.exports = { getFormidable };
