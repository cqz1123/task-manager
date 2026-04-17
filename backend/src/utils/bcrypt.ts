const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
  SALT_ROUNDS
};
