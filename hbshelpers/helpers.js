var moment = require('moment');

function formatDate(date) {

  m = moment.utc(date);

  return m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
}


module.exports = {
  formatDate : formatDate
}
