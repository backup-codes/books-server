const cron = require('node-cron');
const helpers = require('./helpers');

/*
CRONTAB TIMINGS

* * * * *
| | | | |
| | | | +----- Day of the week (0 - 6) (Sunday is both 0 and 7)
| | | +------- Month (1 - 12)
| | +--------- Day of the month (1 - 31)
| +----------- Hour (0 - 23)
+------------- Minute (0 - 59)

*/

// delete old files every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏱  Deleting old files!')
  helpers.deleteOldFiles()
  console.log('✅ Old files deleted!')
});

console.log('Cron Job started!')

module.exports = cron