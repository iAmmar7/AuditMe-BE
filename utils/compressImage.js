const fs = require('fs');
const Jimp = require('jimp');

const compressImage = async (path) => {
  const stats = await fs.statSync(path);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

  let quality = 60;
  if (fileSizeInMegabytes > 2) quality = 40;
  if (fileSizeInMegabytes > 5) quality = 15;
  if (fileSizeInMegabytes > 7) quality = 5;

  if (fileSizeInMegabytes > 1) {
    await Jimp.read(path, (err, image) => {
      if (!err) {
        image.quality(quality).write(path);
      } else {
        console.log('Image compress error', err);
      }
    });
  }
};

module.exports = compressImage;
