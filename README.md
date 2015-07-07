# Skull

Skull sits on top of Backbone and protects your application's brains.

It deals with several annoying things in Backbone-based development:
* **Nested views management and memory leaks** are no longer problem: nested views described in declarative way (much like events) and are created and destroyed automagically
* **Enhanced templating management** for Views, _.template as default engine, template caching even if engine doesn't support it (and vice versa for debugging purposes), and marking start and end of every *rendered* template in DOM
* **Global objects, like `application`** are no longer needed with Registry pattern implementation and DI
* **No more annoying duplication of URLs in models and collections** — just declare `resource` member in your model
* **Every model and collection** emits consistent events `syncStart` and `syncEnd`
* **Redefine global syncing or for particular model or collection** is no longer problem, override `Skull.Syncer`
* **«What is Application?»** problem solved with `Skull.Application` class
* **«It's nor a model, nor a collection, nor a view, not a router…»** Define your own class hierarchy, based on `Skull.Abstract` and `Skull.Observable`

And many more small improvements an even more to come.

## Installation

Skull supports npm and bower:
```
npm install backbone-skull
bower install backbone-skull
```

Skull can be used with both CommonJS (Browserify) and AMD (require.js) loaders, as well as plain old browser globals.

## Usage

Please refer to `example` directory.

## Development

Clone repo, perform `npm install` and start hacking. To run tests, do `npm test`, to update docs — `npm jsdoc`. Skull relies on jscs and eslint for code conventions and on mocha/chai for unit-tests.
