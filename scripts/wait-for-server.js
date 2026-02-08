import http from 'http';

const checkServer = (url, maxAttempts = 60) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          console.log(`✓ Server ready at ${url}`);
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Server at ${url} not ready after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 1000);
        }
      }).on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server at ${url} not reachable after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 1000);
        }
      });
    };

    check();
  });
};

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error('Usage: node wait-for-server.js <url1> [url2] ...');
  process.exit(1);
}

Promise.all(urls.map(url => checkServer(url)))
  .then(() => {
    console.log('All servers ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
