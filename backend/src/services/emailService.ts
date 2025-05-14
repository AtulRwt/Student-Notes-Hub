import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Create a test account for development
const createTestAccount = async () => {
  try {
    // Generate ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.warn('Could not create test email account:', error);
    return createNoEmailTransport();
  }
};

// For production or Mailtrap
const createProdTransport = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Email sending will be disabled.');
    return createNoEmailTransport();
  }
  
  // Check if using SMTP service (like Mailtrap)
  if (process.env.EMAIL_SERVICE === 'smtp' && process.env.EMAIL_HOST) {
    console.log('Using SMTP configuration for email transport');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Default for other services like Gmail
  console.log(`Using ${process.env.EMAIL_SERVICE} service for email transport`);
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Fallback transport that logs instead of sending
const createNoEmailTransport = () => {
  return {
    sendMail: async (mailOptions: any) => {
      console.log('Email sending disabled. Would have sent:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Text:', mailOptions.text.substring(0, 100) + '...');
      
      // Return a mock successful response
      return {
        messageId: '<mock-id>',
        response: 'Mock email success'
      };
    }
  };
};

// Get the appropriate transport based on environment
const getTransport = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.EMAIL_SERVICE === 'smtp') {
    return createProdTransport();
  }
  
  // Use Ethereal test account for development
  return await createTestAccount();
};

// Send an email
export const sendEmail = async ({ to, subject, text, html }: EmailOptions): Promise<boolean> => {
  try {
    const transport = await getTransport();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Student Notes Hub <noreply@studentnoteshub.com>',
      to,
      subject,
      text,
      html: html || text
    };
    
    const info = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Log preview URL for ethereal emails in development
    if (process.env.NODE_ENV !== 'production' && 'preview' in info) {
      console.log('Email preview URL:', info.preview);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Format feedback notification email
export const formatFeedbackEmail = (feedback: any): EmailOptions => {
  const subject = `New Feedback Submission: ${feedback.category || 'General'}`;
  
  const text = `
    New feedback has been submitted:
    
    Name: ${feedback.name}
    Email: ${feedback.email}
    Category: ${feedback.category || 'General'}
    Rating: ${feedback.rating ? `${feedback.rating}/5` : 'Not provided'}
    
    Message:
    ${feedback.message}
    
    Timestamp: ${new Date(feedback.createdAt).toLocaleString()}
  `;
  
  const html = `
    <h2>New Feedback Submission</h2>
    <p><strong>Category:</strong> ${feedback.category || 'General'}</p>
    
    <h3>User Information:</h3>
    <p><strong>Name:</strong> ${feedback.name}</p>
    <p><strong>Email:</strong> ${feedback.email}</p>
    
    <h3>Feedback Details:</h3>
    <p><strong>Rating:</strong> ${feedback.rating ? `${feedback.rating}/5` : 'Not provided'}</p>
    
    <h3>Message:</h3>
    <p>${feedback.message}</p>
    
    <p><em>Submitted on: ${new Date(feedback.createdAt).toLocaleString()}</em></p>
  `;
  
  return {
    to: feedback.emailTo,
    subject,
    text,
    html
  };
}; 