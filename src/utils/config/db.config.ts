import 'dotenv/config';

// Central Mongo connection config — mirrors the reference's utils/config/db.config.
export default {
  uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carrental',
};
