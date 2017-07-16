// Copy as config.js and fill out appropriately

// Custom names for specific pod IDs or groups of IDs
this.names = {
  'living': 'nai7wtfb',
  'master': 'ds78TBo7',
  'spare': 'asc3safJ',
  'main': ['nai7wtfb', 'ds78TBo7'],
};

// Names that will perform changes to all your pods
this.all_keywords = new Set(['all', 'the']);

this.measurement_triggers = [
  {
    pods: 'all',
    trigger: {
      condition: 'enter',
      bounds: {
        temperature: { from: 20, to: 23 },
      },
    },
    action: {
      on: false,
    },
  },
  {
    pods: 'living',
    trigger: {
      condition: 'exit',
      location: 'home',
      bounds: {
        temperature: { from: 18, to: 25 },
      },
    },
    action: {
      on: true,
      mode: 'auto',
      targetTemperature: 22,
    },
  },
];

// Valid values for particular AC state settings
this.valid_values = {
  fanLevel: new Set(['quiet', 'low', 'medium', 'high', 'auto']),
  mode: new Set(['cool', 'heat', 'fan', 'dry', 'auto']),
};

// API settings
this.api_root = 'https://home.sensibo.com/api/v2';
this.api_key = 'kysgefKYJGnkjyGNKygKYgKJYgekeg';

// Server settings
this.port = 23628;

// How long to wait for Sensibo to reply to GET requests (ms)
this.get_timeout = 5000;

// How long to wait between retries (ms)
this.retry_timeout = 5;
