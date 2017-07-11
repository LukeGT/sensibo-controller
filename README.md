# sensibo-controller

A Sensibo API proxy suitable for IFTTT webhooks. Features:

* A convenient `PATCH` method which allows you to change a subset of an aircon pod's state without first reading its present state. Great for IFTTT webhooks.
* Refer to your pods by room name
* Lenient name resolution, suitable for voice input
* Add aliases for your pods
* Send commands to all of your pods at once
* Retries on top of the Sensibo API to improve reliability

## Setup

Simple setup:

```
git clone https://github.com/LukeGT/sensibo-controller.git
cd sensibo-controller
cp config.example.js config.js
npm install
npm start
```

You can run `npm start` in a screen session, or to be safe you should run this with [upstart](http://upstart.ubuntu.com/) or [systemd](https://wiki.debian.org/systemd) or some other thing that monitors your process and makes sure it's running.

## API

`PATCH` `/pods/:name/acState?apiKey=<apiKey>`

body:
```
{
  "propertyName": "propertyValue"
}
```

The pod(s) referred to by `name` will have the properties specified in the body changed to the specified values. The current state of the referenced pod will be retrieved, the specified properties will be merged in, and this new state will be sent to the pod(s).

See below for how name resolution works.

Supports all properties that the Sensibo API supports. Unfortunately these aren't documented, but take a look at the server logs as you interact with it to see what kinds of properties are set.

## Name resolution

The API strips `name`s of all whitespace and converts them to lowercase, then maps them to pod ID(s) as follows:

* If the name is in `config.all_keywords`, apply to all pods owned by user
* Otherwise, split the name on whitespace and try to match each word to a room name. **Room names with multiple words will not work, you should instead add a single word alias for these rooms in `config.names`**.

## Config

See comments within `config.example.js`.
