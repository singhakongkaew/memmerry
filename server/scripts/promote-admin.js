require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run promote-admin -- user@example.com');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true }))
  .then((user) => {
    if (!user) throw new Error(`User not found: ${email}`);
    console.log(`Admin role granted to ${user.email}`);
  })
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
