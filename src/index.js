const http = require('http');
const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const exec = util.promisify(require('child_process').exec);
const defaultConfig = require('./default-config.json');
const userConfig = require('./config.json');

const config = Object.assign(defaultConfig, userConfig);

function validateHmac(digest, payload) {
  const key = process.env.AUTH_KEY;
  if (!key) {
    throw new Error("Tried to validate the request but AUTH_KEY environment variable is not set!");
  }
  const ourDigest = crypto.createHmac('sha1', key).update(payload).digest('hex');
  return crypto.timingSafeEqual(digest, ourDigest);
}

function validateGithub(headers, body) {
  const digest = headers['X-Hub-Signature'].match(/sha1=(.*)/)[1];
  return validateHmac(digest, body);
}

function methodNotSupported(response) {
  response.writeHead(405, {'Allow': 'POST'})
  response.write("Method not allowed");
  response.end()
}

function internalServerError(response) {
  response.writeHead(500);
  response.write("Internal server error");
  response.end();
}

function forbidden(response) {
  response.writeHead(403);
  response.write("Forbidden");
  response.end();
}

function processRequest(request, response) {
  if (request.method !== 'POST') {
    methodNotSupported(response);
    return;
  }
  let requestData = '';

  request.on('data', data => {
    requestData += data;
    if (requestData.length > 5 * 1000 * 1000)
      request.connection.destroy();
  });

  request.on('end', async () => {
    if (config.auth === 'github'
      && !validateGithub(request.headers, requestData)) {
      forbidden(response);
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
  });

}

http.createServer(async (request, response) => {
  try {
    processRequest(request, response);
  } catch(e) {
    console.error(e);
    internalServerError(response);
  }
}).listen(8080, console.log);
