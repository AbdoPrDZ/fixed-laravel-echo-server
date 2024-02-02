const echo = require('../dist/index.js');

const options = require('../fixed-laravel-echo-server');

echo.run(options).then(echo => {
  echo.stop();
});
