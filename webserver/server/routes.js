var assert = require('better-assert');
var lib = require('./lib');
var database = require('./database');
var user = require('./user');
var admin = require('./admin');
var games = require('./games');
var sendEmail = require('./sendEmail');
var config = require('../config/config');
var recaptchaValidator = require('recaptcha-validator');


var production = process.env.NODE_ENV === 'production';

function staticPageLogged(page, loggedGoTo) {
    return function(req, res) {
        var user = req.user;
        if (!user){
            return res.render(page);
        }
        if (loggedGoTo) return res.redirect(loggedGoTo);

        res.render(page, {
            user: user,
        });
    }
}
 
function contact(origin) {
    assert(typeof origin == 'string');

    return function(req, res, next) {
        var user = req.user;
        var from = req.body.email;
        var message = req.body.message;

        if (!from ) return res.render(origin, { user: user, warning: 'email required' });

        if (!message) return res.render(origin, { user: user, warning: 'message required' });

        if (user) message = 'user_id: ' + req.user.id + '\n' + message;

        sendEmail.contact(from, message, null, function(err) {
            if (err)
                return next(new Error('Error sending email: \n' + err ));

            return res.render(origin, { user: user, success: 'Thank you for writing, one of my humans will write you back very soon :) ' });
        });
    }
}

function restrict(req, res, next) {
    if (!req.user) {
       res.status(401);
       if (req.header('Accept') === 'text/plain')
          res.send('Not authorized');
       else
          res.render('401');
       return;
    } else
        next();
}

function restrictRedirectToHome(req, res, next) {
    if(!req.user) {
        res.redirect('/');
        return;
    }
    next();
}

function adminRestrict(req, res, next) {

    if (!req.user || !req.user.admin) {
        res.status(401);
        if (req.header('Accept') === 'text/plain')
            res.send('Not authorized');
        else
            res.render('401'); //Not authorized page.
        return;
    }
    next();
}

function recaptchaRestrict(req, res, next) {
  var recaptcha = lib.removeNullsAndTrim(req.body['g-recaptcha-response']);
  if (!recaptcha) {
    return res.send('No recaptcha submitted, go back and try again');
  }

  recaptchaValidator.callback(config.RECAPTCHA_PRIV_KEY, recaptcha, req.ip, function(err) {
    if (err) {
      if (typeof err === 'string')
        res.send('Got recaptcha error: ' + err + ' please go back and try again');
      else {
        console.error('[INTERNAL_ERROR] Recaptcha failure: ', err);
        res.render('error');
      }
      return;
    }

    next();
  });
}

function tableNew() {
    return function(req, res) {
        res.render('table_new', {
            user: req.user,
            buildConfig: config.BUILD,
            table: true
        });
    }
}


module.exports = function(app) {

    app.get('/', staticPageLogged('index'));
    app.get('/register', user.register);
    app.get('/login', staticPageLogged('login', '/play'));
    app.get('/reset/:recoverId', user.validateResetPassword);
    app.get('/faq', staticPageLogged('faq'));
    app.get('/contact', staticPageLogged('contact'));
    app.get('/deposit', restrict, user.deposit);
    app.get('/withdraw', restrict, user.withdraw);
    app.get('/transfer', restrict, user.transfer);
    app.get('/check-deposit', restrict, user.checkDeposit);
    app.get('/commission', restrict, user.commission);
    app.get('/withdraw/request', restrict, user.withdrawRequest);
    app.get('/transfer/request', restrict, user.transferRequest);
    app.get('/support', restrict, user.contact);
    app.get('/account', restrict, user.account);
    app.get('/security', restrict, user.security);
    app.get('/forgot-password', staticPageLogged('forgot-password'));
    app.get('/calculator', staticPageLogged('calculator'));
    app.get('/guide', staticPageLogged('guide'));

    app.get('/play', tableNew());

    app.get('/leaderboard', games.getLeaderBoard);
    app.get('/game/:id', games.show);
    app.get('/user/:name', user.profile);
    app.get('/network', user.network);

    app.get('/error', function(req, res, next) { // Sometimes we redirect people to /error
      return res.render('error');
    });

    app.post('/sent-reset', user.resetPasswordRecovery);
    app.post('/sent-recover', recaptchaRestrict, user.sendPasswordRecover);
    app.post('/reset-password', restrict, user.resetPassword);
    app.post('/edit-email', restrict, user.editEmail);
    app.post('/enable-2fa', restrict, user.enableMfa);
    app.post('/disable-2fa', restrict, user.disableMfa);
    app.post('/withdraw/request', restrict, user.handleWithdrawRequest);
    app.post('/transfer/request', restrict, user.handleTransferRequest);
    app.post('/support', restrict, contact('support'));
    app.post('/contact', contact('contact'));
    app.post('/logout', restrictRedirectToHome, user.logout);
    app.post('/login', recaptchaRestrict, user.login);
    app.post('/register', recaptchaRestrict, user.handleRegister);

    app.post('/ott', restrict, function(req, res, next) {
        var user = req.user;
        var ipAddress = req.ip;
        var userAgent = req.get('user-agent');
        assert(user);
        database.createOneTimeToken(user.id, ipAddress, userAgent, function(err, token) {
            if (err) {
                console.error('[INTERNAL_ERROR] unable to get OTT got ' + err);
                res.status(500);
                return res.send('Server internal error');
            }
            res.send(token);
        });
    });


    // Admin stuff
    app.get('/admin', adminRestrict, admin.admin);
    app.get('/admin/users', adminRestrict, admin.users);
    app.get('/admin/users/:id', adminRestrict, admin.userDetail);
    app.get('/admin/transfers', adminRestrict, admin.transfers);
    app.get('/admin/deposits', adminRestrict, admin.deposits);
    app.get('/admin/withdraws', adminRestrict, admin.withdraws);
    app.get('/admin/commissions', adminRestrict, admin.commissions);

    app.get('/admin/giveaway', adminRestrict, admin.giveAway);
    app.post('/admin/giveaway', adminRestrict, admin.giveAwayHandle);
    app.post('/admin/withdraws/process', adminRestrict, admin.withdrawProcessHandle);
    app.post('/admin/users/:id/resetpassword', adminRestrict, admin.resetpasswordHandle);
    app.post('/admin/users/:id/changerole', adminRestrict, admin.changeroleHandle);

    app.get('*', function(req, res) {
        res.status(404);
        res.render('404');
    });
};