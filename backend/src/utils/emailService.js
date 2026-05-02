const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetLink) => {
  // For development, we just log the link to the console.
  // If you want to send real emails, configure a transporter here (e.g., using SendGrid, Resend, or Gmail).
  
  console.log('-----------------------------------------');
  console.log(`PASSWORD RESET EMAIL SENT TO: ${email}`);
  console.log(`RESET LINK: ${resetLink}`);
  console.log('-----------------------------------------');

  // Example of a real transporter (commented out):
  /*
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: '"Team Task Manager" <noreply@taskmanager.com>',
    to: email,
    subject: 'Password Reset Request',
    text: `Click the following link to reset your password: ${resetLink}`,
    html: `<p>Click the following link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
  });
  */
};

module.exports = { sendResetEmail };
