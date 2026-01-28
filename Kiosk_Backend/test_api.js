const http = require('http');

const endpoints = [
    '/health',
    '/api/diagnostics/performance',
    '/api/diagnostics/network',
    '/api/diagnostics/system',
    '/api/diagnostics/application',
    '/api/weight',
    '/api/weight/status',
    '/api/scanner-status',
    '/api/object',
    '/api/realsense-status',
    '/api/kiosk-status'
];

const hostname = 'localhost';
const port = 5000;

endpoints.forEach(endpoint => {
    const options = {
        hostname: hostname,
        port: port,
        path: endpoint,
        method: 'GET'
    };

    const req = http.request(options, res => {
        let data = '';
        res.on('data', chunk => {
            data += chunk;
        });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`✅ ${endpoint}: ${res.statusCode}`);
                console.log(`   Response: ${JSON.stringify(json).substring(0, 100)}...`);
            } catch {
                console.log(`❌ ${endpoint}: ${res.statusCode} - Could not parse JSON`);
            }
        });
    });

    req.on('error', error => {
        console.error(`❌ ${endpoint}: ${error.message}`);
    });

    req.end();
});