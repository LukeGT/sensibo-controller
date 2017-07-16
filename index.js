const express = require('express');
const request_promise = require('request-promise-native');
const body_parser = require('body-parser');
const promise_retry = require('promise-retry');
const _ = require('lodash');

const config = require('./config');


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

const patch_pods = (apiKey, ids, patch) => {

  const qs = {
    apiKey,
    fields: 'acState'
  };

  if (typeof ids === 'string') {
    ids = [ids];
  }

  console.log('Fetching pods:', ids);

  return Promise.all(ids.map( (id) => {

    return request('get', config.api_root + '/pods/' + id, {qs, json: true, timeout: config.get_timeout})

    .then( (data) => {
      return change_state(apiKey, id, data.result.acState, patch);
    })
  }));
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

const get_names = () => {

  return request('get', config.api_root + '/users/me/pods', {
    qs: {
      apiKey: config.api_key,
      fields: 'id,room',
    },
    json: true,
  })

  .then( (data) => {
    return _.assign(
      _.fromPairs(data.result.map( (pod) => [pod.room.name.toLowerCase(), pod.id] )),
      config.names
    );
  });
}

const pod_names = get_names();
pod_names.then( (names) => console.log('Got pod names:', names))

const get_ids = (name) => {

  return pod_names.then( (names) => {

    for (let word of name.toLowerCase().split(/\s/)) {
      if (names[word]) return names[word];
    }

    return null;
  });
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

  const patch = req.body;
  sanitize_patch(patch);

  get_ids(req.params.name)

  .then( (pod_ids) => {

    if (config.all_keywords.has(req.params.name.trim())) {
      return patch_all_pods(req.query.apiKey, patch);

    } else if (pod_ids) {
      return patch_pods(req.query.apiKey, pod_ids, patch);

    } else {
      throw {
        status: 404,
        reason: 'Pod not found: ' + req.params.name,
      };
    }
  })
  
  .then((data) => {
    console.log('Success');
    res.sendStatus(204);
  })

  .catch((error) => {
    if (error.status) {
      console.log('ERROR: Request failed:', error.reason, '\n', req.path, req.query, req.body);
      res.sendStatus(error.status);
    } else {
      console.log('ERROR: Request failed:', error, '\n', req.path, req.query, req.body);
      res.sendStatus(500);
    }
  });
});

app.listen(config.port, () => console.log('Server started'));
