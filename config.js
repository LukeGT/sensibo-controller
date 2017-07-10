this.names = {
  'main': 'frbfV56T',
  'bedroom': 't7AKK3gg',
  'study': '563uhxqj',
};

this.valid_values = {
  fanLevel: new Set(['quiet', 'low', 'medium', 'high', 'auto']),
};

this.all_keywords = new Set(['all', 'the']);

this.api_root = 'https://home.sensibo.com/api/v2';
this.port = 23628;
this.get_timeout = 5000;
this.retry_timeout = 5;
