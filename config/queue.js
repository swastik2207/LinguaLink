const {Queue}= require ("bullmq");
const dotenv = require('dotenv');

dotenv.config();

const redisUrl = new URL(process.env.UPSTASH_REDIS_URL);

 const emailQueue = new Queue("emails", {
  connection: {
    host: redisUrl.hostname,
    port: Number(redisUrl.port),
    password: redisUrl.password,
    tls: {} // required for Upstash
  }
});

module.exports = {emailQueue}
