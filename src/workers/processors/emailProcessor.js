const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  },
   tls: {
    rejectUnauthorized: false // 🚨 disables cert validation
  }
});

module.exports = async function emailProcessor(job) {
  const { to, subject, html } = job.data;

  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    html
  });

  console.log(`✅ Email sent to ${to}`);
};
