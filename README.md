# sensibo-controller

A Sensibo API proxy suitable for IFTTT webhooks. Features:

* A convenient `PATCH` method which allows you to change a subset of an aircon pod's state without first reading its present state. Great for IFTTT webhooks.
* Refer to your pods by room name
* Send commands to all of your pods at once, or a certain subset of your pods
* Add aliases for your pods, or groups of pods
* Lenient name resolution, suitable for voice input
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

The API is designed such that free text (such as spoken words) can be supplied in the `name` parameter. The API strips `name`s of all leading/trailing whitespace, reduces all consecutive whitespace characters to a single space, and converts all text to lowercase.

* If the entire name is in `config.all_keywords`, apply to all pods owned by user
* Otherwise, apply the command to all pods whose name appears as a substring of the supplied name

This allows you to refer to 'all' of your pods, a certain pod by name, or multiple pods by name.

## Config

See comments within `config.example.js`.
