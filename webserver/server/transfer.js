var assert = require('assert');
var db = require('./database');
var request = require('request');
var config = require('../config/config');

// Doesn't validate
module.exports = function(userId, satoshis, to_user, transferId, callback) {
    assert(typeof userId === 'number');
    assert(typeof callback === 'function');

    db.makeTransfer(userId, satoshis, to_user, transferId, function (err, fundingId) {
        if (err) {
            callback(err);
            return;
        }
        callback('TRANFERED');
    });
};