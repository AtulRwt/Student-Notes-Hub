const http = require('http');

console.log('Running smoke test checking http://localhost:5000/health ...');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${data}`);

        if (res.statusCode === 200) {
            // Optional: check body content
            if (data.includes('ok')) {
                console.log('Smoke Test PASSED: API is healthy.');
                process.exit(0);
            } else {
                console.log('Smoke Test FAILED: API status 200 but unexpected body.');
                process.exit(1);
            }
        } else {
            console.log('Smoke Test FAILED: API returned non-200 status.');
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`Smoke Test FAILED: Connection error - ${e.message}`);
    console.error('Make sure the backend is running with "npm run dev:backend" or "npm start"');
    process.exit(1);
});

req.timeout = 5000; // 5 second timeout
req.on('timeout', () => {
    console.error('Smoke Test FAILED: Timed out');
    req.destroy();
    process.exit(1);
});

req.end();
