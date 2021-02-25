const fs = require('fs');
const Jimp = require('jimp');

const compressImage = async (path) => {
  const stats = await fs.statSync(path);
  const fileSizeInBytes = stats.size;
  const fileSizeInKilobytes = fileSizeInBytes / 1024;

  let quality = 50;
  if (fileSizeInKilobytes > 1000) quality = 35;
  if (fileSizeInKilobytes > 2000) quality = 25;
  if (fileSizeInKilobytes > 3000) quality = 15;
  if (fileSizeInKilobytes > 5000) quality = 3;
  if (fileSizeInKilobytes > 7000) quality = 1;

  if (fileSizeInKilobytes > 500) {
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
