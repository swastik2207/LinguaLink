const { Worker } = require("bullmq");
const { connection } = require("../../config/workerConnection");
const emailProcessor = require("./processors/emailProcessor");

const worker = new Worker("emails", emailProcessor, { connection });
console.log(connection);

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

console.log("📨 Email worker running...");
