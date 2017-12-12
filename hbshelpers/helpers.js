var moment = require('moment');

function formatDate(date) {

  m = moment.utc(date);

  return m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
}

function math(operand1, op, operand2){
  operand1 = parseFloat(operand1);
  operand2 = parseFloat(operand2);
  return {
    "+": operand1 + operand2,
    "-": operand1 - operand2,
    "*": operand1 * operand2,
    "/": operand1 / operand2,
    "%": operand1 / operand2
  }[op];
}


module.exports = {
  formatDate : formatDate,
  math : math
}
