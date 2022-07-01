const moment = require('moment');


function formatMessage(usrName, text){
    return {
        usrName,
        text,
        time: moment().format('h:mm a')
    }
}

module.exports = formatMessage  ;