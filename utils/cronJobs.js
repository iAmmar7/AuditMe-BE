const cron = require('node-cron');
const moment = require('moment');

const PrioritiesReport = require('../db/models/PrioritiesReport');

// Runs every day at minute 0 past every 6th hour
cron.schedule('0 */6 * * *', async () => {
  // Date before 3 days
  const date = moment().utcOffset(0).subtract(2, 'days').format('YYYY-MM-DD');

  // const reports = await PrioritiesReport.find({
  //   createdAt: { $lt: date },
  //   isPrioritized: false,
  //   status: { $ne: 'Resolved' },
  // });
  // console.log(reports.length);

  await PrioritesReport.updateMany(
    { createdAt: { $lt: date }, isPrioritized: false, status: { $ne: 'Resolved' } },
    { $set: { isPrioritized: true } },
  )
    .then((res) => console.log(`Successfully updated ${res?.nModified} issues by cron job`))
    .catch((err) => console.log('Issue update failed in cron job', err));
});
