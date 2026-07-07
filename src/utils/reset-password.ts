import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

// Ops-level password reset — the recovery path for the super-admin (top of the
// chain) or any account, run by whoever has server/DB access.
//
//   npm run reset-password -- <email> <newPassword>
//
(async () => {
  const email = (process.argv[2] || '').toLowerCase().trim();
  const password = process.argv[3] || '';
  if (!email || !password) {
    console.error('Usage: npm run reset-password -- <email> <newPassword>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carrental';
  await mongoose.connect(uri);
  const hash = await bcrypt.hash(password, 10);
  const res = await mongoose.connection.db.collection('users').updateOne(
    { email },
    { $set: { password: hash, passwordChangedAt: new Date(), active: true }, $unset: { resetTokenHash: '', resetTokenExpiry: '' } },
  );
  if (res.matchedCount) {
    console.log(`✓ Password reset for ${email}. All existing sessions are now logged out.`);
  } else {
    console.error(`No user found with email: ${email}`);
  }
  await mongoose.disconnect();
  process.exit(res.matchedCount ? 0 : 1);
})().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
