/**
 * Mailtrap Configuration Setup Script
 * 
 * This script helps you set up Mailtrap for email testing.
 * Run with: node setup-mailtrap.js
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Mailtrap Configuration Setup ===\n');
console.log('This script will help you set up Mailtrap for testing the feedback system.');
console.log('You\'ll need your Mailtrap credentials from https://mailtrap.io\n');

const questions = [
  {
    name: 'username',
    question: 'Enter your Mailtrap username: ',
    default: ''
  },
  {
    name: 'password',
    question: 'Enter your Mailtrap password: ',
    default: ''
  },
  {
    name: 'host',
    question: 'Enter the Mailtrap host (press Enter for default): ',
    default: 'sandbox.smtp.mailtrap.io'
  },
  {
    name: 'port',
    question: 'Enter the Mailtrap port (press Enter for default): ',
    default: '2525'
  },
  {
    name: 'from',
    question: 'Enter the FROM email address (press Enter for default): ',
    default: 'Student Notes Hub <noreply@studentnoteshub.com>'
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const q = questions[index];
  rl.question(q.question, (answer) => {
    answers[q.name] = answer || q.default;
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  let existingEnv = '';
  
  try {
    if (fs.existsSync(envPath)) {
      existingEnv = fs.readFileSync(envPath, 'utf8');
      console.log('\nExisting .env file found. Will update email settings only.');
    }
  } catch (err) {
    console.log('\nCreating new .env file.');
  }

  // Parse existing env file if it exists
  const envVars = {};
  if (existingEnv) {
    existingEnv.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1]] = match[2];
        }
      }
    });
  }

  // Update with Mailtrap settings
  envVars['EMAIL_SERVICE'] = 'smtp';
  envVars['EMAIL_HOST'] = answers.host;
  envVars['EMAIL_PORT'] = answers.port;
  envVars['EMAIL_USER'] = answers.username;
  envVars['EMAIL_PASSWORD'] = answers.password;
  envVars['EMAIL_FROM'] = answers.from;
  envVars['FEEDBACK_EMAIL'] = envVars['FEEDBACK_EMAIL'] || 'studentnoteshub@gmail.com';

  // Create new env content
  let newEnvContent = '# Environment Variables\n# Updated by Mailtrap setup script\n\n';
  
  Object.keys(envVars).forEach(key => {
    newEnvContent += `${key}="${envVars[key]}"\n`;
  });

  // Write to file
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n✅ Mailtrap configuration has been saved to .env file!');
  console.log('\nTo test the feedback system:');
  console.log('1. Restart your backend server');
  console.log('2. Submit a feedback form');
  console.log('3. Check your Mailtrap inbox at https://mailtrap.io\n');
  
  rl.close();
}

// Start asking questions
askQuestion(0); 