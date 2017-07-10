const express = require('express');
const request_promise = require('request-promise-native');
const body_parser = require('body-parser');
const promise_retry = require('promise-retry');
const _ = require('lodash');

const config = require('./config');


const app = express();

app.use(body_parser.json());

const request = (method, url, options) => {
  return promise_retry({minTimeout: 5}, (retry, number) => {
    if (number > 1) {
      console.log('retrying...', number);
    }
    return request_promise[method](url, options).catch(retry);
  });
}

const patch_pod = (api_key, id, patch) => {

  const qs = {
    apiKey: api_key
  };

  return request('get', config.api_root + '/pods/' + id + '/acStates', {qs, json: true})

  .then( (data) => {
    const acState = data.result[0].acState;
    for (let property in patch) {
      acState[property] = patch[property];
    }
    console.log('Applying patch:', id, patch, acState);
    return request('post', config.api_root + '/pods/' + id + '/acStates', {qs, body: {acState}, json: true});
  })

  .catch( (error) => {
    throw {
      status: 500,
      reason: {error, id, patch},
    };
  });
};

app.patch('/pods/:name/acState', (req, res) => {

  const pod_id = config.names[req.params.name];
  let promise = null;

  if (req.params.name === 'all') {
    const promises = _.values(config.names).map((id) => patch_pod(req.query.apiKey, id, req.body));
    promise = Promise.all(promises);

  } else if (pod_id) {
    promise = patch_pod(req.query.apiKey, pod_id, req.body);

  } else {
    promise = Promise.reject({
      status: 400,
      reason: 'Invalid name: ' + req.params.name,
    });
  }

  promise.then((data) => {
    console.log('Success');
    res.sendStatus(204);
  })
  .catch((error) => {
    console.log('ERROR: Request failed:', error.reason, '\n', req.path, req.query, req.body);
    res.status(error.status).end();
  });
});

app.listen(config.port);
