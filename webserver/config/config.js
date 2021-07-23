/**
 * For development you can set the variables by creating a .env file on the root
 */
var fs = require('fs');
var production = process.env.NODE_ENV === 'production';

var prodConfig;
if(production) {
  prodConfig = JSON.parse(fs.readFileSync(__dirname + '/build-config.json'));
  console.log('Build config loaded: ', prodConfig);
}

module.exports = {
  "PRODUCTION": production,
  "DATABASE_URL": process.env.DATABASE_URL || "postgres://localhost:5432/bustabitdb",
  "AWS_SES_KEY": process.env.AWS_SES_KEY || 'AKIAVILIY52N7OBPZ2MF',
  "AWS_SES_SECRET": process.env.AWS_SES_SECRET || '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',
  "CONTACT_EMAIL": process.env.CONTACT_EMAIL || "info@bnbbest.io",
  "SITE_URL": process.env.SITE_URL || "https://bnbbest.io",
  "ENC_KEY": process.env.ENC_KEY || "devkey",
  "SIGNING_SECRET": process.env.SIGNING_SECRET || "secret",
  "BANKROLL_OFFSET": parseInt(process.env.BANKROLL_OFFSET) || 0,
  "RECAPTCHA_PRIV_KEY": process.env.RECAPTCHA_PRIV_KEY || '6LdBHnEbAAAAAG5dQwc2afUaIF_IrdQmyUHGlwp2',
  "RECAPTCHA_SITE_KEY": process.env.RECAPTCHA_SITE_KEY || '6LdBHnEbAAAAANMhv5qokctS8LGuL2tTq60SmeH6',
  "PORT":  process.env.PORT || 443,
  "MINING_FEE": process.env.MINING_FEE || 10000,
  "BUILD": prodConfig
};