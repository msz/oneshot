const http = require('http');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const defaultConfig = require('./default-config.json');
const userConfig = require('./config.json');

const config = Object.assign(defaultConfig, userConfig);

function methodNotSupported(response) {
  response.writeHead(405, {'Allow': 'POST'})
  response.write("Method not allowed");
  response.end()
}

http.createServer(async (request, response) => {
  if (request.method !== 'POST') {
    methodNotSupported(response);
    return;
  }
  let responseData;
  try {
    const { stdout, stderr } = await exec(config.command);
    responseData = {
      errorCode: 0,
      stdout,
      stderr
    }
  } catch(e) {
    responseData = {
      errorCode: e.code,
      stdout: e.stdout,
      stderr: e.stderr,
    }
  }
  response.writeHead(200, {'Content-Type': 'application/json'})
  response.write(JSON.stringify(responseData, null, 2));
  response.end();
}).listen(8080, console.log);
