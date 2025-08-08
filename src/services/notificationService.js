const { emailQueue } = require("../../config/queue");

const sendNotification = async (to,subject,message) => {
  try {
    

    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await emailQueue.add("sendEmail", {
      to,
      subject,
      html: `<p>${message}</p>`
    },
{ delay: 5000 });

console.log(`Email queued for ${to} with subject "${subject}"`);
console.log(emailQueue);

    
  } catch (error) {
    console.error("Error queuing email:", error);
    return ({ error: "Failed to queue email" });
  }
};

module.exports = { sendNotification };
