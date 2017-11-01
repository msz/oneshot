const http = require('http');
const util = require('util');
const crypto = require('crypto');
const exec = util.promisify(require('child_process').exec);
const defaultConfig = require('./default-config.json');
const userConfig = require('./config.json');

const config = Object.assign(defaultConfig, userConfig);
const githubSignatureHeader = 'x-hub-signature';

const responses = {
  methodNotSupported: {
    head: {
      code: 405,
      headers: { Allow: 'Post' },
    },
    body: 'Only POST is allowed',
  },
  internalServerError: {
    head: {
      code: 500,
    },
    body: 'Internal server error',
  },
  forbidden: {
    head: {
      code: 403,
    },
    body: 'Forbidden',
  },
};

function validateHmac(digest, payload) {
  const key = process.env.AUTH_KEY;
  if (!key) {
    throw new Error('Tried to validate the request but AUTH_KEY environment variable is not set!');
  }
  const ourDigest = crypto.createHmac('sha1', key).update(payload).digest('hex');
  return crypto.timingSafeEqual(new Buffer(digest), new Buffer(ourDigest));
}

function validateGithub(headers, body) {
  const digest = headers[githubSignatureHeader].match(/sha1=(.*)/)[1];
  return validateHmac(digest, body);
}

async function processRequest(request) {
  if (request.method !== 'POST') {
    return responses.methodNotSupported;
  }
  let requestData = '';

  request.on('data', (data) => {
    requestData += data;
    if (requestData.length > 5 * 1000 * 1000) { request.connection.destroy(); }
  });
  await new Promise((resolve) => {
    request.on('end', resolve);
  });

  console.info(`Got request data: ${requestData}`);

  if (config.auth === 'github'
      && !validateGithub(request.headers, requestData)) {
    return responses.forbidden;
  }

  let responseBody;
  try {
    const { stdout, stderr } = await exec(config.command);
    responseBody = {
      errorCode: 0,
      stdout,
      stderr,
    };
  } catch (e) {
    responseBody = {
      errorCode: e.code,
      stdout: e.stdout,
      stderr: e.stderr,
    };
  }
  return {
    head: {
      code: 200,
      headers: { 'Content-Type': 'application/json' },
    },
    body: JSON.stringify(responseBody, null, 2),
  };
}

function sendResponse(response, responseData) {
  response.writeHead(responseData.head.code, responseData.head.headers || {});
  response.write(responseData.body);
  response.end();
}

http.createServer(async (request, response) => {
  try {
    console.info(`Got request: \n${JSON.stringify({
      method: request.method,
      url: request.url,
      headers: request.headers,
    }, null, 2)}`);
    const responseData = await processRequest(request);
    console.info(`Sending response: \n${JSON.stringify(responseData, null, 2)}`);
    sendResponse(response, responseData);
  } catch (e) {
    console.error(e);
    sendResponse(response, responses.internalServerError);
  }
}).listen(8080);
