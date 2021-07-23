var assert = require('assert');
var db = require('./database');
var request = require('request');
var config = require('../config/config');
const fetch = require('node-fetch');


var sendToAddress = async function(withdrawalAddress, amountToSend) {
    var hash = '';
    //tạo địa chỉ ví
    let response = await fetch(`http://localhost:3000/sendBnb?to=${withdrawalAddress}&amount=${amountToSend}`);
    const json = await response.json();
    if(json.status == 'ok'){
        return json.hash;
    }
    return null;
};
// Doesn't validate
module.exports = function(userId, satoshis, withdrawalAddress, withdrawalId, callback) {
    assert(typeof userId === 'number');
    assert(typeof withdrawalAddress === 'string');
    assert(typeof callback === 'function');

    db.makeWithdrawal(userId, satoshis, withdrawalAddress, withdrawalId, async function (err, fundingId) {
        if (err) {
            if (err.code === '23514')
                callback('NOT_ENOUGH_MONEY');
            else if(err.code === '23505')
                callback('SAME_WITHDRAWAL_ID');
            else
                callback(err);
            return;
        }

        assert(fundingId);

        var amountToSend = satoshis *0.98/1000000;  //2% fee
        let hash = await sendToAddress(withdrawalAddress, amountToSend);
        if (!hash) {
            if (err.message === 'Insufficient funds')
                return callback('PENDING');
            return callback('FUNDING_QUEUED');
        }
        db.setFundingsWithdrawalTxid(fundingId, hash, function (err) {
            if (err)
                return callback(new Error('Could not set fundingId ' + fundingId + ' to ' + hash + ': \n' + err));

            callback(null, hash);
        });
    });
};