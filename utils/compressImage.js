const fs = require('fs');
const Jimp = require('jimp');

const compressImage = async (path) => {
  const stats = await fs.statSync(path);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

  if (fileSizeInMegabytes > 1) {
    await Jimp.read(path, (err, image) => {
      if (!err) {
        image.quality(60).write(path);
      }
    });
  }
};

module.exports = compressImage;
