const express = require('express');
const request_promise = require('request-promise-native');
const body_parser = require('body-parser');
const promise_retry = require('promise-retry');
const _ = require('lodash');

const config = require('./config');


// TODO: For singular queries, use /pods/:id GET to fetch acState faster:
// https://home.sensibo.com/api/v2/pods/563uhxqj?apiKey=...&fields=acState

// TODO: Determine room name to ID mapping automatically, but allow customisations
// https://home.sensibo.com/api/v2/users/me/pods?apiKey=...&fields=id,name


const app = express();

app.use(body_parser.json());

const request = (method, url, options) => {

  return promise_retry({minTimeout: config.retry_timeout}, (retry, number) => {
    if (number > 1) {
      console.log('retrying...', number);
    }
    return request_promise[method](url, options).catch(retry);
  })

  .catch( (error) => {
    throw {
      status: 500,
      reason: {error, id, patch},
    };
  });
}

const patch_pod = (apiKey, id, patch) => {

  const qs = { apiKey };

  console.log('Fetching pod:', id);

  return request('get', config.api_root + '/pods/' + id + '/acStates', {qs, json: true, timeout: config.get_timeout})

  .then( (data) => {
    return change_state(apiKey, id, data.result[0].acState, patch);
  });
};

const patch_all_pods = (apiKey, patch) => {

  const qs = {
    apiKey,
    fields: 'acState,id',
  };

  console.log('Fetching all pods');

  return request('get', config.api_root + '/users/me/pods', {qs, json: true, timeout: config.get_timeout})

  .then( (data) => {
    return Promise.all(data.result.map( (pod) => change_state(apiKey, pod.id, pod.acState, patch)));
  });
}

// WARNING: This method modifies the acState object in place
const change_state = (apiKey, id, acState, patch) => {
  
  const qs = { apiKey };

  for (let property in patch) {
    acState[property] = patch[property];
  }

  console.log('Applying patch:', id, patch, acState);

  return request('post', config.api_root + '/pods/' + id + '/acStates', {qs, body: {acState}, json: true});
}

const get_id = (name) => {

  for (let word of name.toLowerCase().split(/\s/)) {
    if (config.names[word]) {
      return config.names[word];
    }
  }

  return null;
}

const sanitize_patch = (patch) => {

  for (let property in patch) {

    if (typeof(patch[property]) === 'string') {
      patch[property] = patch[property].toLowerCase();
    }

    if (!config.valid_values[property]) continue;

    for (let word of patch[property].split(/\s/)) {
      if (config.valid_values[property].has(word)) {
        patch[property] = word;
        break;
      }
    }
  }
};

app.patch('/pods/:name/acState', (req, res) => {

  console.log('Got request:', req.path, req.body);

  const pod_id = get_id(req.params.name);
  const patch = req.body;
  let promise = null;

  sanitize_patch(patch);

  if (config.all_keywords.has(req.params.name.trim())) {
    promise = patch_all_pods(req.query.apiKey, patch);

  } else if (pod_id) {
    promise = patch_pod(req.query.apiKey, pod_id, patch);

  } else {
    promise = Promise.reject({
      status: 404,
      reason: 'Pod not found: ' + req.params.name,
    });
  }

  promise.then((data) => {
    console.log('Success');
    res.sendStatus(204);
  })

  .catch((error) => {
    if (error.status) {
      console.log('ERROR: Request failed:', error.reason, '\n', req.path, req.query, req.body);
      res.status(error.status).end();
    } else {
      console.log('ERROR: Request failed:', error, '\n', req.path, req.query, req.body);
      res.status(500).end();
    }
  });
});

app.listen(config.port, () => console.log('Server started'));
