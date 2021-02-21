const fs = require('fs');
const cron = require('node-cron');
const moment = require('moment');

// Load models
const PrioritiesReport = require('../db/models/PrioritiesReport');

// Load utils
const compressImage = require('./compressImage');

// @Timings - Runs every 6th hour
// @Description - Move issues from observation to priority if it is 3 days old
cron.schedule('0 */6 * * *', async () => {
  console.log('1st cron job starts');

  // Date before 3 days
  const date = moment().utcOffset(0).subtract(2, 'days').format('YYYY-MM-DD');

  await PrioritesReport.updateMany(
    { createdAt: { $lt: date }, isPrioritized: false, status: { $ne: 'Resolved' } },
    { $set: { isPrioritized: true } },
  )
    .then((res) => console.log(`Successfully updated ${res && res.nModified} issues by cron job`))
    .catch((err) => console.log('Issue update failed in cron job', err));
});
