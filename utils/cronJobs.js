const fs = require('fs');
const cron = require('node-cron');
const moment = require('moment');

// Load models
const PrioritiesReport = require('../db/models/PrioritiesReport');

// Load utils
const compressImage = require('./compressImage');

// @Timings - Runs every 6th hour
// @Desc - Move issues from observation to priority if it is 3 days old
cron.schedule('0 */6 * * *', async () => {
  console.log('1st cron job starts');

  // Date before 3 days - skip weekends, friday and saturday
  let subtract = 2,
    i = 1;
  let date = moment().utcOffset(0);
  while (i <= 3) {
    if (date.isoWeekday() === 5 || date.isoWeekday() === 6) {
      subtract++;
    }
    date = date.subtract(1, 'days');
    ++i;
  }
  const dateToCheck = moment().utcOffset(0).subtract(subtract, 'days').format('YYYY-MM-DD');

  await PrioritesReport.updateMany(
    { createdAt: { $lt: dateToCheck }, isPrioritized: false, status: { $ne: 'Resolved' } },
    { $set: { isPrioritized: true } },
  )
    .then((res) => console.log(`Successfully updated ${res && res.nModified} issues by cron job`))
    .catch((err) => console.log('Issue update failed in cron job', err));
});
