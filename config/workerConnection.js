const IORedis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

const connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {}
});

module.exports = { connection };