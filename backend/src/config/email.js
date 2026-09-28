const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Library System" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Email error:', error.message)
    throw error
  }
}

module.exports = { sendEmail }





















// const nodemailer = require('nodemailer')

// const createTransporter = async () => {
//   // Use Ethereal for testing
//   if (process.env.NODE_ENV === 'development') {
//     const testAccount = await nodemailer.createTestAccount()
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.ethereal.email',
//       port: 587,
//       secure: false,
//       auth: {
//         user: testAccount.user,
//         pass: testAccount.pass,
//       },
//     })
//     return { transporter, testAccount }
//   }

//   // Production — use real Gmail
//   const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     secure: false,
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS,
//     },
//   })
//   return { transporter, testAccount: null }
// }

// const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const { transporter, testAccount } = await createTransporter()

//     const info = await transporter.sendMail({
//       from: '"Library System" <library@system.com>',
//       to,
//       subject,
//       html,
//     })

//     // In development show preview URL
//     if (testAccount) {
//       console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
//     }

//     console.log('Email sent:', info.messageId)
//     return info
//   } catch (error) {
//     console.error('Email error:', error.message)
//     throw error
//   }
// }

// module.exports = { sendEmail }