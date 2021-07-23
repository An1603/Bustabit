var assert = require('assert');
var async = require('async');
var database = require('./database');
var config = require('../config/config');
var timeago = require('timeago');

var stats;
var generated;
var bankrollOffset = config.BANKROLL_OFFSET;
function getSiteStats() {
    database.getSiteStats(function(err, results) {
        if (err) {
            console.error('[INTERNAL_ERROR] Unable to get site stats: \n' + err);
            return;
        }

        stats = results;
        generated = new Date();
    });
}

setInterval(getSiteStats, 1000 * 60 * 20);
getSiteStats();

exports.admin = function(req, res, next) {
    if (!stats) {
        return next('Stats are loading');
    }
    var user = req.user;
    stats.bankroll_offset = bankrollOffset;
    res.render('admin/index', { user: user, generated: timeago(generated), stats: stats });
};

exports.users = function(req, res) {
    var user = req.user;
    assert(user.admin);
    database.getAllUsers(function(err, users) {
        if (err) {
            return next(new Error('Unable to get transfers: \n' + err));
        }
        res.render('admin/users', { user: user, users: users });
    });
};

exports.userDetail = function(req, res) {
    var user_id = req.params.id;
    database.getUserStats(user_id, function(err, user) {
        if (err) {
            return next(new Error('Unable to get detail: \n' + err));
        }
        res.render('admin/user-detail', { user: req.user, userDetail: user });
    });
};

exports.transfers = function(req, res) {
    var user = req.user;
    assert(user.admin);
    database.getAllTransfers(function(err, transfers) {
        if (err) {
            return next(new Error('Unable to get transfers: \n' + err));
        }
        res.render('admin/transfers', { user: user, transfers: transfers });
    });
};

exports.deposits = function(req, res) {
    var user = req.user;
    assert(user.admin);
    database.getAllDeposits(function(err, deposits) {
        if (err) {
            return next(new Error('Unable to get deposits: \n' + err));
        }
        res.render('admin/deposits', { user: user, deposits: deposits });
    });
};
exports.commissions = function(req, res) {
    var user = req.user;
    assert(user.admin);
    database.getAllCommissions(function(err, commissions) {
        if (err) {
            return next(new Error('Unable to get commissions: \n' + err));
        }
        res.render('admin/commissions', { user: user, commissions: commissions });
    });
};

exports.withdraws = function(req, res) {
    var user = req.user;
    assert(user.admin);
    database.getAllWithdrawals(function(err, withdraws) {
        if (err) {
            return next(new Error('Unable to get withdraws: \n' + err));
        }
        res.render('admin/withdraws', { user: user, withdraws: withdraws });
    });
};



exports.giveAway = function(req, res) {
    var user = req.user;
    assert(user.admin);
    res.render('admin/giveaway', { user: user });
};

exports.changeroleHandle = function(req, res, next) {
    var user = req.user;
    var user_id = req.params.id;
    var role = req.body.role;
    
    database.changeUserRole(user_id, role , function(err) {
        if (err) return res.redirect('/admin/users?err=' + err);

        res.redirect('/admin/users');
    });
};

exports.resetpasswordHandle = function(req, res, next) {
    var user = req.user;
    var user_id = req.params.id;
    var password = req.body.password;

    console.log(user_id);
    console.log(password);
    
    database.changeUserPassword(user_id, password , function(err) {
        if (err) return res.redirect('/admin/users?err=' + err);

        res.redirect('/admin/users');
    });
};

exports.withdrawProcessHandle = function(req, res, next) {
    var user = req.user;
    var withdraw_id = req.body.withdraw_id;
    var isApprove = req.body.isApprove;
    var comment = req.body.comment;
    
    assert(user.admin);
};

exports.giveAwayHandle = function(req, res, next) {
    var user = req.user;
    assert(user.admin);

    if (config.PRODUCTION) {
        var ref = req.get('Referer');
        if (!ref) return next(new Error('Possible xsfr')); //Interesting enough to log it as an error

        if (ref.lastIndexOf('https://bnbbest.io/admin/giveaway', 0) !== 0)
            return next(new Error('Bad referrer got: ' + ref));
    }

    var giveAwayUsers = req.body.users.split(/\s+/);
    var bnbs = parseFloat(req.body.bnbs);

    if (!Number.isFinite(bnbs) || bnbs <= 0)
        return next('Problem with bnbs...');

    var satoshis = Math.round(bnbs);

    database.addRawGiveaway(giveAwayUsers, satoshis , function(err) {
        if (err) return res.redirect('/admin/giveaway?err=' + err);

        res.redirect('/admin/giveaway?m=Done');
    });
};