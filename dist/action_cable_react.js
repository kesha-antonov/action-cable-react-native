/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	window.ActionCableReact = {
	  ActionCable: __webpack_require__(1),
	  Cable: __webpack_require__(8),
	  CableMixin: __webpack_require__(9),
	  ChannelMixin: __webpack_require__(10),
	  version: __webpack_require__(13)
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var ActionCable, Consumer,
	  slice = [].slice;

	Consumer = __webpack_require__(2);

	ActionCable = {
	  INTERNAL: __webpack_require__(4),
	  WebSocket: window.WebSocket,
	  logger: window.console,
	  createConsumer: function(url) {
	    return new Consumer(this.createWebSocketURL(url), this.log, this.WebSocket);
	  },
	  createWebSocketURL: function(url) {
	    if (url && !/^wss?:/i.test(url)) {
	      url = url.replace('http', 'ws');
	    }
	    return url;
	  },
	  startDebugging: function() {
	    return this.debugging = true;
	  },
	  stopDebugging: function() {
	    return this.debugging = null;
	  },
	  log: function() {
	    var messages, ref;
	    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	    if (this.debugging) {
	      messages.push(Date.now());
	      return (ref = this.logger).log.apply(ref, ["[ActionCable]"].concat(slice.call(messages)));
	    }
	  }
	};

	module.exports = ActionCable;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var Connection, Consumer, Subscription, Subscriptions;

	Connection = __webpack_require__(3);

	Subscriptions = __webpack_require__(5);

	Subscription = __webpack_require__(6);

	Consumer = (function() {
	  function Consumer(url, log, WebSocket) {
	    this.url = url;
	    this.log = log;
	    this.WebSocket = WebSocket;
	    this.subscriptions = new Subscriptions(this);
	    this.connection = new Connection(this, this.log, this.WebSocket);
	  }

	  Consumer.prototype.send = function(data) {
	    return this.connection.send(data);
	  };

	  Consumer.prototype.connect = function() {
	    return this.connection.open();
	  };

	  Consumer.prototype.disconnect = function() {
	    return this.connection.close({
	      allowReconnect: false
	    });
	  };

	  Consumer.prototype.ensureActiveConnection = function() {
	    if (!this.connection.isActive()) {
	      return this.connection.open();
	    }
	  };

	  return Consumer;

	})();

	module.exports = Consumer;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Connection, i, message_types, protocols, ref, supportedProtocols, unsupportedProtocol,
	  slice = [].slice,
	  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
	  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	ref = __webpack_require__(4), message_types = ref.message_types, protocols = ref.protocols;

	supportedProtocols = 2 <= protocols.length ? slice.call(protocols, 0, i = protocols.length - 1) : (i = 0, []), unsupportedProtocol = protocols[i++];

	Connection = (function() {
	  Connection.reopenDelay = 500;

	  function Connection(consumer, log, WebSocket1) {
	    this.consumer = consumer;
	    this.log = log;
	    this.WebSocket = WebSocket1;
	    this.open = bind(this.open, this);
	    this.subscriptions = this.consumer.subscriptions;
	    this.monitor = new ConnectionMonitor(this, this.log);
	    this.disconnected = true;
	  }

	  Connection.prototype.send = function(data) {
	    if (this.isOpen()) {
	      this.webSocket.send(JSON.stringify(data));
	      return true;
	    } else {
	      return false;
	    }
	  };

	  Connection.prototype.open = function() {
	    if (this.isActive()) {
	      this.log("Attempted to open WebSocket, but existing socket is " + (this.getState()));
	      throw new Error("Existing connection must be closed before opening");
	    } else {
	      this.log("Opening WebSocket, current state is " + (this.getState()) + ", subprotocols: " + protocols);
	      if (this.webSocket != null) {
	        this.uninstallEventHandlers();
	      }
	      this.webSocket = new this.WebSocket(this.consumer.url, protocols);
	      this.installEventHandlers();
	      this.monitor.start();
	      return true;
	    }
	  };

	  Connection.prototype.close = function(arg) {
	    var allowReconnect, ref1;
	    allowReconnect = (arg != null ? arg : {
	      allowReconnect: true
	    }).allowReconnect;
	    if (!allowReconnect) {
	      this.monitor.stop();
	    }
	    if (this.isActive()) {
	      return (ref1 = this.webSocket) != null ? ref1.close() : void 0;
	    }
	  };

	  Connection.prototype.reopen = function() {
	    var error, error1;
	    this.log("Reopening WebSocket, current state is " + (this.getState()));
	    if (this.isActive()) {
	      try {
	        return this.close();
	      } catch (error1) {
	        error = error1;
	        return this.log("Failed to reopen WebSocket", error);
	      } finally {
	        this.log("Reopening WebSocket in " + this.constructor.reopenDelay + "ms");
	        setTimeout(this.open, this.constructor.reopenDelay);
	      }
	    } else {
	      return this.open();
	    }
	  };

	  Connection.prototype.getProtocol = function() {
	    var ref1;
	    return (ref1 = this.webSocket) != null ? ref1.protocol : void 0;
	  };

	  Connection.prototype.isOpen = function() {
	    return this.isState("open");
	  };

	  Connection.prototype.isActive = function() {
	    return this.isState("open", "connecting");
	  };

	  Connection.prototype.isProtocolSupported = function() {
	    var ref1;
	    return ref1 = this.getProtocol(), indexOf.call(supportedProtocols, ref1) >= 0;
	  };

	  Connection.prototype.isState = function() {
	    var ref1, states;
	    states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	    return ref1 = this.getState(), indexOf.call(states, ref1) >= 0;
	  };

	  Connection.prototype.getState = function() {
	    var ref1, state, value;
	    for (state in WebSocket) {
	      value = WebSocket[state];
	      if (value === ((ref1 = this.webSocket) != null ? ref1.readyState : void 0)) {
	        return state.toLowerCase();
	      }
	    }
	    return null;
	  };

	  Connection.prototype.installEventHandlers = function() {
	    var eventName, handler;
	    for (eventName in this.events) {
	      handler = this.events[eventName].bind(this);
	      this.webSocket["on" + eventName] = handler;
	    }
	  };

	  Connection.prototype.uninstallEventHandlers = function() {
	    var eventName;
	    for (eventName in this.events) {
	      this.webSocket["on" + eventName] = function() {};
	    }
	  };

	  Connection.prototype.events = {
	    message: function(event) {
	      var identifier, message, ref1, type;
	      if (!this.isProtocolSupported()) {
	        return;
	      }
	      ref1 = JSON.parse(event.data), identifier = ref1.identifier, message = ref1.message, type = ref1.type;
	      switch (type) {
	        case message_types.welcome:
	          this.monitor.recordConnect();
	          return this.subscriptions.reload();
	        case message_types.ping:
	          return this.monitor.recordPing();
	        case message_types.confirmation:
	          return this.subscriptions.notify(identifier, "connected");
	        case message_types.rejection:
	          return this.subscriptions.reject(identifier);
	        default:
	          return this.subscriptions.notify(identifier, "received", message);
	      }
	    },
	    open: function() {
	      this.log("WebSocket onopen event, using '" + (this.getProtocol()) + "' subprotocol");
	      this.disconnected = false;
	      if (!this.isProtocolSupported()) {
	        this.log("Protocol is unsupported. Stopping monitor and disconnecting.");
	        return this.close({
	          allowReconnect: false
	        });
	      }
	    },
	    close: function(event) {
	      this.log("WebSocket onclose event");
	      if (this.disconnected) {
	        return;
	      }
	      this.disconnected = true;
	      this.monitor.recordDisconnect();
	      return this.subscriptions.notifyAll("disconnected", {
	        willAttemptReconnect: this.monitor.isRunning()
	      });
	    },
	    error: function() {
	      return this.log("WebSocket onerror event");
	    }
	  };

	  return Connection;

	})();

	module.exports = Connection;


/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = {
	  message_types: {
	    welcome: 'welcome',
	    ping: 'ping',
	    confirmation: 'confirm_subscription',
	    rejection: 'reject_subscription'
	  },
	  default_mount_path: '/cable',
	  protocols: ['actioncable-v1-json', 'actioncable-unsupported']
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var INTERNAL, Subscription, Subscriptions,
	  slice = [].slice;

	INTERNAL = __webpack_require__(4);

	Subscription = __webpack_require__(6);

	Subscriptions = (function() {
	  function Subscriptions(consumer) {
	    this.consumer = consumer;
	    this.subscriptions = [];
	  }

	  Subscriptions.prototype.create = function(channelName, mixin) {
	    var channel, params, subscription;
	    channel = channelName;
	    params = typeof channel === 'object' ? channel : {
	      channel: channel
	    };
	    subscription = new Subscription(this.consumer, params, mixin);
	    return this.add(subscription);
	  };

	  Subscriptions.prototype.add = function(subscription) {
	    this.subscriptions.push(subscription);
	    this.consumer.ensureActiveConnection();
	    this.notify(subscription, "initialized");
	    this.sendCommand(subscription, "subscribe");
	    return subscription;
	  };

	  Subscriptions.prototype.remove = function(subscription) {
	    this.forget(subscription);
	    if (!this.findAll(subscription.identifier).length) {
	      this.sendCommand(subscription, "unsubscribe");
	    }
	    return subscription;
	  };

	  Subscriptions.prototype.reject = function(identifier) {
	    var i, len, ref, results, subscription;
	    ref = this.findAll(identifier);
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      subscription = ref[i];
	      this.forget(subscription);
	      this.notify(subscription, "rejected");
	      results.push(subscription);
	    }
	    return results;
	  };

	  Subscriptions.prototype.forget = function(subscription) {
	    var s;
	    this.subscriptions = (function() {
	      var i, len, ref, results;
	      ref = this.subscriptions;
	      results = [];
	      for (i = 0, len = ref.length; i < len; i++) {
	        s = ref[i];
	        if (s !== subscription) {
	          results.push(s);
	        }
	      }
	      return results;
	    }).call(this);
	    return subscription;
	  };

	  Subscriptions.prototype.findAll = function(identifier) {
	    var i, len, ref, results, s;
	    ref = this.subscriptions;
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      s = ref[i];
	      if (s.identifier === identifier) {
	        results.push(s);
	      }
	    }
	    return results;
	  };

	  Subscriptions.prototype.reload = function() {
	    var i, len, ref, results, subscription;
	    ref = this.subscriptions;
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      subscription = ref[i];
	      results.push(this.sendCommand(subscription, "subscribe"));
	    }
	    return results;
	  };

	  Subscriptions.prototype.notifyAll = function() {
	    var args, callbackName, i, len, ref, results, subscription;
	    callbackName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
	    ref = this.subscriptions;
	    results = [];
	    for (i = 0, len = ref.length; i < len; i++) {
	      subscription = ref[i];
	      results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
	    }
	    return results;
	  };

	  Subscriptions.prototype.notify = function() {
	    var args, callbackName, i, len, results, subscription, subscriptions;
	    subscription = arguments[0], callbackName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
	    if (typeof subscription === "string") {
	      subscriptions = this.findAll(subscription);
	    } else {
	      subscriptions = [subscription];
	    }
	    results = [];
	    for (i = 0, len = subscriptions.length; i < len; i++) {
	      subscription = subscriptions[i];
	      results.push(typeof subscription[callbackName] === "function" ? subscription[callbackName].apply(subscription, args) : void 0);
	    }
	    return results;
	  };

	  Subscriptions.prototype.sendCommand = function(subscription, command) {
	    var identifier;
	    identifier = subscription.identifier;
	    return this.consumer.send({
	      command: command,
	      identifier: identifier
	    });
	  };

	  return Subscriptions;

	})();

	module.exports = Subscriptions;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter, Subscription,
	  extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	  hasProp = {}.hasOwnProperty;

	EventEmitter = __webpack_require__(7);

	Subscription = (function(superClass) {
	  var extend;

	  extend1(Subscription, superClass);

	  function Subscription(consumer, params, mixin) {
	    this.consumer = consumer;
	    if (params == null) {
	      params = {};
	    }
	    this.identifier = JSON.stringify(params);
	    extend(this, mixin);
	  }

	  Subscription.prototype.perform = function(action, data) {
	    if (data == null) {
	      data = {};
	    }
	    data.action = action;
	    return this.send(data);
	  };

	  Subscription.prototype.send = function(data) {
	    return this.consumer.send({
	      command: 'message',
	      identifier: this.identifier,
	      data: JSON.stringify(data)
	    });
	  };

	  Subscription.prototype.unsubscribe = function() {
	    return this.consumer.subscriptions.remove(this);
	  };

	  extend = function(object, properties) {
	    var key, value;
	    if (properties != null) {
	      for (key in properties) {
	        value = properties[key];
	        object[key] = value;
	      }
	    }
	    return object;
	  };

	  Subscription.prototype.connected = function() {
	    return this.emit('connected');
	  };

	  Subscription.prototype.disconnected = function() {
	    return this.emit('disconnected');
	  };

	  Subscription.prototype.rejected = function() {
	    return this.emit('rejected');
	  };

	  Subscription.prototype.received = function(data) {
	    data.action = data.action != null ? data.action : 'received';
	    return this.emit(data.action, data);
	  };

	  return Subscription;

	})(EventEmitter);

	module.exports = Subscription;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var has = Object.prototype.hasOwnProperty;

	//
	// We store our EE objects in a plain object whose properties are event names.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// `~` to make sure that the built-in object properties are not overridden or
	// used as an attack vector.
	// We also assume that `Object.create(null)` is available when the event name
	// is an ES6 Symbol.
	//
	var prefix = typeof Object.create !== 'function' ? '~' : false;

	/**
	 * Representation of a single EventEmitter function.
	 *
	 * @param {Function} fn Event handler to be called.
	 * @param {Mixed} context Context for function execution.
	 * @param {Boolean} [once=false] Only emit once
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Minimal EventEmitter interface that is molded against the Node.js
	 * EventEmitter interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() { /* Nothing to set */ }

	/**
	 * Hold the assigned EventEmitters by name.
	 *
	 * @type {Object}
	 * @private
	 */
	EventEmitter.prototype._events = undefined;

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var events = this._events
	    , names = []
	    , name;

	  if (!events) return names;

	  for (name in events) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return a list of assigned event listeners.
	 *
	 * @param {String} event The events that should be listed.
	 * @param {Boolean} exists We only need to know if there are listeners.
	 * @returns {Array|Boolean}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event, exists) {
	  var evt = prefix ? prefix + event : event
	    , available = this._events && this._events[evt];

	  if (exists) return !!available;
	  if (!available) return [];
	  if (available.fn) return [available.fn];

	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
	    ee[i] = available[i].fn;
	  }

	  return ee;
	};

	/**
	 * Emit an event to all registered event listeners.
	 *
	 * @param {String} event The name of the event.
	 * @returns {Boolean} Indication if we've emitted an event.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events || !this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if ('function' === typeof listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Register a new EventListener for the given event.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} [context=this] The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events) this._events = prefix ? {} : Object.create(null);
	  if (!this._events[evt]) this._events[evt] = listener;
	  else {
	    if (!this._events[evt].fn) this._events[evt].push(listener);
	    else this._events[evt] = [
	      this._events[evt], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Add an EventListener that's only called once.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} [context=this] The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events) this._events = prefix ? {} : Object.create(null);
	  if (!this._events[evt]) this._events[evt] = listener;
	  else {
	    if (!this._events[evt].fn) this._events[evt].push(listener);
	    else this._events[evt] = [
	      this._events[evt], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Remove event listeners.
	 *
	 * @param {String} event The event we want to remove.
	 * @param {Function} fn The listener that we need to find.
	 * @param {Mixed} context Only remove listeners matching this context.
	 * @param {Boolean} once Only remove once listeners.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events || !this._events[evt]) return this;

	  var listeners = this._events[evt]
	    , events = [];

	  if (fn) {
	    if (listeners.fn) {
	      if (
	           listeners.fn !== fn
	        || (once && !listeners.once)
	        || (context && listeners.context !== context)
	      ) {
	        events.push(listeners);
	      }
	    } else {
	      for (var i = 0, length = listeners.length; i < length; i++) {
	        if (
	             listeners[i].fn !== fn
	          || (once && !listeners[i].once)
	          || (context && listeners[i].context !== context)
	        ) {
	          events.push(listeners[i]);
	        }
	      }
	    }
	  }

	  //
	  // Reset the array, or remove it completely if we have no more listeners.
	  //
	  if (events.length) {
	    this._events[evt] = events.length === 1 ? events[0] : events;
	  } else {
	    delete this._events[evt];
	  }

	  return this;
	};

	/**
	 * Remove all listeners or only the listeners for the specified event.
	 *
	 * @param {String} event The event want to remove all listeners for.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  if (!this._events) return this;

	  if (event) delete this._events[prefix ? prefix + event : event];
	  else this._events = prefix ? {} : Object.create(null);

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Expose the module.
	//
	if (true) {
	  module.exports = EventEmitter;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	var Cable;

	Cable = (function() {
	  function Cable(channels) {
	    this.channels = channels;
	  }

	  Cable.prototype.channel = function(name) {
	    return this.channels[name];
	  };

	  Cable.prototype.setChannel = function(name, channel) {
	    return this.channels[name] = channel;
	  };

	  return Cable;

	})();

	module.exports = Cable;


/***/ },
/* 9 */
/***/ function(module, exports) {

	var CableMixin;

	CableMixin = function(React) {
	  return {
	    componentWillMount: function() {
	      var namePart;
	      if (!(this.props.cable || (this.context && this.context.cable))) {
	        namePart = this.constructor.displayName ? ' of ' + this.constructor.displayName : '';
	        throw new Error("Could not find cable on this.props or this.context" + namePart);
	      }
	    },
	    childContextTypes: {
	      cable: React.PropTypes.object
	    },
	    contextTypes: {
	      cable: React.PropTypes.object
	    },
	    getChildContext: function() {
	      return {
	        cable: this.getCable()
	      };
	    },
	    getCable: function() {
	      return this.props.cable || this.context && this.context.cable;
	    }
	  };
	};

	CableMixin.componentWillMount = function() {
	  throw new Error('ActionCableReact.CableMixin is a function that takes React as a ' + 'parameter and returns the mixin, e.g.: mixins: [ActionCableReact.CableMixin(React)]');
	};

	module.exports = CableMixin;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var ChannelMixin, _capitalize;

	_capitalize = __webpack_require__(11);

	ChannelMixin = function() {
	  var channelNames;
	  channelNames = Array.prototype.slice.call(arguments);
	  return {
	    componentDidMount: function() {
	      var action, actionMethod, cable, channel, i, len, results;
	      cable = this.props.cable || this.context.cable;
	      this.mounted = true;
	      results = [];
	      for (i = 0, len = channelNames.length; i < len; i++) {
	        channel = channelNames[i];
	        if (cable.channel(channel)) {
	          if (this.handleConnected != null) {
	            cable.channel(channel).on('connected', this.handleConnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).on('disconnected', this.handleDisconnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).on('rejected', this.handleDisconnected);
	          }
	          if (this.handleReceived != null) {
	            cable.channel(channel).on('received', this.handleReceived);
	          }
	          results.push((function() {
	            var j, len1, ref, results1;
	            ref = cable.channel(channel).actions;
	            results1 = [];
	            for (j = 0, len1 = ref.length; j < len1; j++) {
	              action = ref[j];
	              actionMethod = "handle" + (_capitalize(action));
	              if (this[actionMethod] != null) {
	                results1.push(cable.channel(channel).on(action, this[actionMethod]));
	              } else {
	                results1.push(void 0);
	              }
	            }
	            return results1;
	          }).call(this));
	        } else {
	          results.push(void 0);
	        }
	      }
	      return results;
	    },
	    componentWillUnmount: function() {
	      var action, actionMethod, cable, channel, i, len, results;
	      cable = this.props.cable || this.context.cable;
	      this.mounted = false;
	      results = [];
	      for (i = 0, len = channelNames.length; i < len; i++) {
	        channel = channelNames[i];
	        if (cable.channel(channel)) {
	          if (this.handleConnected != null) {
	            cable.channel(channel).removeListener('connected', this.handleConnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).removeListener('disconnected', this.handleDisconnected);
	          }
	          if (this.handleDisconnected != null) {
	            cable.channel(channel).removeListener('rejected', this.handleDisconnected);
	          }
	          if (this.handleReceived != null) {
	            cable.channel(channel).removeListener('received', this.handleReceived);
	          }
	          results.push((function() {
	            var j, len1, ref, results1;
	            ref = cable.channel(channel).actions;
	            results1 = [];
	            for (j = 0, len1 = ref.length; j < len1; j++) {
	              action = ref[j];
	              actionMethod = "handle" + (_capitalize(action));
	              if (this[actionMethod] != null) {
	                results1.push(cable.channel(channel).removeListener(action, this[actionMethod]));
	              } else {
	                results1.push(void 0);
	              }
	            }
	            return results1;
	          }).call(this));
	        } else {
	          results.push(void 0);
	        }
	      }
	      return results;
	    },
	    perform: function(channel, action, data) {
	      var cable;
	      if (data == null) {
	        data = {};
	      }
	      cable = this.props.cable || this.context.cable;
	      return cable.channel(channel).perform(action, data);
	    }
	  };
	};

	ChannelMixin.componentWillMount = function() {
	  throw new Error('ActionCableReact.ChannelMixin is a function that takes one or more ' + 'store names as parameters and returns the mixin, e.g.: ' + 'mixins: [ActionCableReact.ChannelMixin("Channel1", "Channel2")]');
	};

	module.exports = ChannelMixin;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	var baseToString = __webpack_require__(12);

	/**
	 * Capitalizes the first character of `string`.
	 *
	 * @static
	 * @memberOf _
	 * @category String
	 * @param {string} [string=''] The string to capitalize.
	 * @returns {string} Returns the capitalized string.
	 * @example
	 *
	 * _.capitalize('fred');
	 * // => 'Fred'
	 */
	function capitalize(string) {
	  string = baseToString(string);
	  return string && (string.charAt(0).toUpperCase() + string.slice(1));
	}

	module.exports = capitalize;


/***/ },
/* 12 */
/***/ function(module, exports) {

	/**
	 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern modularize exports="npm" -o ./`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */

	/**
	 * Converts `value` to a string if it's not one. An empty string is returned
	 * for `null` or `undefined` values.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  return value == null ? '' : (value + '');
	}

	module.exports = baseToString;


/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = '0.1.1'


/***/ }
/******/ ]);