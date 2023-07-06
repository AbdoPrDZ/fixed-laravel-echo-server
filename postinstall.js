const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json'); // Assuming package.json is one level above the postinstall.js file

fs.readFile(packageJsonPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading package.json:', err);
    return;
  }

  const packageJson = JSON.parse(data);
  packageJson.scripts = packageJson.scripts || {}; // Create the "scripts" property if it doesn't exist

  // Add your custom script here
  packageJson.scripts['laravel-echo-sever'] = 'node node_module/fixed-laravel-echo-server/bin/server.js';

  const updatedPackageJson = JSON.stringify(packageJson, null, 2);

  fs.writeFile(packageJsonPath, updatedPackageJson, 'utf8', (err) => {
    if (err) {
      console.error('Error writing package.json:', err);
      return;
    }

    console.log('Script added to package.json');
  });
});
