const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  managerCode: process.env.MANAGER_REGISTRATION_CODE,
};