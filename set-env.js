const fs = require('fs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Configure Angular `environment.ts` file path
const targetPath = './src/environments/environment.ts';
const targetPathProd = './src/environments/environment.prod.ts';

// `environment.ts` file structure
const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '${process.env.API_URL_DEV}'
};
`;

const prodEnvConfigFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL_PROD}'
};
`;

console.log('The file `environment.ts` will be written with the following content: \n');
console.log(envConfigFile);
fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        throw console.error(err);
    } else {
        console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);
    }
});

console.log('The file `environment.prod.ts` will be written with the following content: \n');
console.log(prodEnvConfigFile);
fs.writeFile(targetPathProd, prodEnvConfigFile, function (err) {
    if (err) {
        throw console.error(err);
    } else {
        console.log(`Angular environment.prod.ts file generated correctly at ${targetPathProd} \n`);
    }
});
