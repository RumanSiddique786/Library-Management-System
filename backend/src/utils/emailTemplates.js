const welcomeEmail = (memberName, memberId, expiryDate) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #333; }
    .info-box { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Welcome to the Library!</h1>
    </div>
    <div class="body">
      <h2>Hello, ${memberName}!</h2>
      <p>Your library membership has been successfully created. Here are your details:</p>
      <div class="info-box">
        <p><strong>Member ID:</strong> ${memberId}</p>
        <p><strong>Membership Valid Until:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
      </div>
      <p>You can now borrow books, reserve titles, and access our digital library.</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

const dueReminderEmail = (memberName, books, dueDate) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #333; }
    .book-list { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .book-item { padding: 8px 0; border-bottom: 1px solid #fde68a; }
    .book-item:last-child { border-bottom: none; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .warning { color: #d97706; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Book Due Reminder</h1>
    </div>
    <div class="body">
      <h2>Hello, ${memberName}!</h2>
      <p>This is a reminder that the following book(s) are due on <span class="warning">${new Date(dueDate).toLocaleDateString()}</span>:</p>
      <div class="book-list">
        ${books.map((book) => `
          <div class="book-item">
            <strong>${book.title}</strong><br/>
            <small>Copy: ${book.copyCode}</small>
          </div>
        `).join('')}
      </div>
      <p>Please return the book(s) on time to avoid late fines.</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

const overdueEmail = (memberName, books, fineAmount) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #333; }
    .fine-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .book-list { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .book-item { padding: 8px 0; border-bottom: 1px solid #fecaca; }
    .book-item:last-child { border-bottom: none; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .danger { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Overdue Books Notice</h1>
    </div>
    <div class="body">
      <h2>Hello, ${memberName}!</h2>
      <p>You have <span class="danger">overdue books</span> that need to be returned immediately.</p>
      <div class="book-list">
        ${books.map((book) => `
          <div class="book-item">
            <strong>${book.title}</strong><br/>
            <small>Due: ${new Date(book.dueDate).toLocaleDateString()}</small>
          </div>
        `).join('')}
      </div>
      <div class="fine-box">
        <p><strong>Current Fine:</strong> <span class="danger">₹${fineAmount}</span></p>
        <p>Fine increases daily until books are returned.</p>
      </div>
      <p>Please return the books as soon as possible to avoid further fines.</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

const membershipExpiryEmail = (memberName, expiryDate) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #7c3aed; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #333; }
    .info-box { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Membership Expiry Notice</h1>
    </div>
    <div class="body">
      <h2>Hello, ${memberName}!</h2>
      <p>Your library membership is expiring soon.</p>
      <div class="info-box">
        <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
      </div>
      <p>Please visit the library to renew your membership and continue enjoying our services.</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

const fineReceiptEmail = (memberName, fineAmount, paymentMode, bookTitle) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #059669; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #333; }
    .receipt-box { background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 4px; padding: 20px; margin: 20px 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
    .receipt-row:last-child { border-bottom: none; font-weight: bold; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Fine Payment Receipt</h1>
    </div>
    <div class="body">
      <h2>Hello, ${memberName}!</h2>
      <p>Your fine payment has been received successfully.</p>
      <div class="receipt-box">
        <div class="receipt-row">
          <span>Book</span>
          <span>${bookTitle}</span>
        </div>
        <div class="receipt-row">
          <span>Payment Mode</span>
          <span>${paymentMode}</span>
        </div>
        <div class="receipt-row">
          <span>Amount Paid</span>
          <span>₹${fineAmount}</span>
        </div>
        <div class="receipt-row">
          <span>Date</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <p>Thank you for your payment. You can now borrow books again.</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

module.exports = {
  welcomeEmail,
  dueReminderEmail,
  overdueEmail,
  membershipExpiryEmail,
  fineReceiptEmail,
}