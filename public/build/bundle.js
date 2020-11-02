
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let currentPath = writable("C:\\Users\\Mike\\Desktop\\WEB DEV\\devworkbench");
    let navHistory = writable([]);

    const storeCurrentPath = {
      subscribe: currentPath.subscribe,
      set: val => {
        currentPath.set(val);
        localStorage.setItem("currentPath", JSON.stringify(val));
      }
    };

    const storeNavHistory = {
      subscribe: navHistory.subscribe,
      set: val => {
        navHistory.set(val);
        localStorage.setItem("navHistory", JSON.stringify(val));
      }
    };

    const generateColors = (navCrumbs) => {
      console.log("generateColors, navCrumbs: ", navCrumbs);
      let navCrumbObjects = [];
      let hueOffset = 222;
      let brightnessInterval = 30 / navCrumbs.length;

      for (let i = 0; i < navCrumbs.length; i++) {
        // console.log("navCrumbObjects: ", navCrumbObjects);
        navCrumbObjects = [
          ...navCrumbObjects,
          {
            name: navCrumbs[i],
            color: `--breadcrumb-color: hsla(${hueOffset}, 40%, ${
          60 + brightnessInterval * i
        }%, 1)`,
          },
        ];
      }
      return navCrumbObjects;
    };

    class CustomLogging {
      constructor(title) {
        this.title = {
          body: title || "---",
          color: "rgba(0,0,0,0.5)",
          size: "1rem",
          margin: "0.5rem 0",
          before: ">>>",
          after: "$$$",
        };

        this.body = {
          color: "rgba(0,0,0,1)",
          size: "1rem",
          padding: ".5rem 0",
        };
      }

      setTitleStyle({ color, size, margin, padding, before, after }) {
        if (color !== undefined) this.title.color = color;
        if (size !== undefined) this.title.size = size;
        if (margin !== undefined) this.title.margin = margin;
        if (padding !== undefined) this.title.padding = padding;
        if (before !== undefined) this.title.before = before;
        if (after !== undefined) this.title.after = after;
      }

      setBodyStyle({ color, size, margin, padding }) {
        if (color !== undefined) this.body.color = color;
        if (size !== undefined) this.body.size = size;
        if (margin !== undefined) this.body.margin = margin;
        if (padding !== undefined) this.body.padding = padding;
      }

      log(body = "") {
        // the second line is now the body because the first references the content after the first %c for the title
        console.log(
          `${this.title.before} %c${this.title.body} ${this.title.after} %c${body}`,
          `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
          `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
        );
      }

      l(body = "") {
        // the second line is now the body because the first references the content after the first %c for the title
        console.log(
          `%c${this.title.body} ${this.title.after} %c${body}`,
          `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
          `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
        );
      }
      back(body = "") {
        // the second line is now the body because the first references the content after the first %c for the title
        console.log(
          `%c${this.title.body} <<< \n%c${body}`,
          `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
          `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
        );
      }
      forward(body = "") {
        // the second line is now the body because the first references the content after the first %c for the title
        console.log(
          `%c${this.title.body} >>> \n%c${body}`,
          `color: ${this.title.color}; font-weight: bold; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
          `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
        );
      }
    }

    const error = new CustomLogging("error");
    error.setBodyStyle({ color: "red", size: "2rem" });

    const special = new CustomLogging("special");
    special.setBodyStyle({
      color: "rgba(0,70,255,0.5)",
      size: "1.2rem",
      padding: "1rem",
    });
    special.setTitleStyle({
      color: "rgba(0,70,255,0.5)",
      size: "1.2rem",
      margin: "0 0 0 0rem",
      after: "!!!",
    });

    const back = new CustomLogging("back");
    back.setBodyStyle({
      color: "rgba(0,70,255,0.5)",
      size: "1rem",
      padding: "1rem",
    });
    back.setTitleStyle({
      color: "rgba(255,155,70,0.95)",
      size: "1.2rem",
      margin: "0 0 0 0",
    });

    const forward = new CustomLogging("forward");
    forward.setBodyStyle({
      color: "rgba(0,70,255,0.5)",
      size: "1rem",
      padding: "1rem",
    });
    forward.setTitleStyle({
      color: "rgba(70,205,70,0.95)",
      size: "1.2rem",
      margin: "0 0 0 0",
    });

    const customStyles = [];
    customStyles.push(error, special);
    // let customStylesObjects = []
    // customStylesObjects.push({"error": error}, {"special": special},{ "back": back}, {"forward": forward})

    let customStylesObjects = {
      error: error,
      special: special,
      back: back,
      forward: forward,
    };
    let c = { error: error, special: special, back: back, forward: forward };

    var CustomLogging_1 = { customStyles, customStylesObjects, c };
    var CustomLogging_2 = CustomLogging_1.customStyles;
    var CustomLogging_3 = CustomLogging_1.customStylesObjects;
    var CustomLogging_4 = CustomLogging_1.c;

    /* src\filesystem\navigation.svelte generated by Svelte v3.19.1 */
    const file$1 = "src\\filesystem\\navigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (351:4) {#each navCrumbObjects as crumb, i}
    function create_each_block(ctx) {
    	let span;
    	let t0_value = /*crumb*/ ctx[24].name + "";
    	let t0;
    	let t1;
    	let span_style_value;
    	let span_index_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "breadcrumb svelte-qvnm7r");
    			attr_dev(span, "style", span_style_value = /*crumb*/ ctx[24].color);
    			attr_dev(span, "index", span_index_value = /*i*/ ctx[26]);
    			add_location(span, file$1, 351, 6, 10482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			dispose = listen_dev(span, "click", /*click_handler_3*/ ctx[23], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navCrumbObjects*/ 1 && t0_value !== (t0_value = /*crumb*/ ctx[24].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*navCrumbObjects*/ 1 && span_style_value !== (span_style_value = /*crumb*/ ctx[24].color)) {
    				attr_dev(span, "style", span_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(351:4) {#each navCrumbObjects as crumb, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div9;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div3;
    	let div2;
    	let i1;
    	let t1;
    	let div5;
    	let div4;
    	let i2;
    	let t2;
    	let div7;
    	let div6;
    	let i3;
    	let t3;
    	let div8;
    	let dispose;
    	let each_value = /*navCrumbObjects*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			i1 = element("i");
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			i2 = element("i");
    			t2 = space();
    			div7 = element("div");
    			div6 = element("div");
    			i3 = element("i");
    			t3 = space();
    			div8 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i0, "id", "openDirectory");
    			attr_dev(i0, "class", "svelte-qvnm7r");
    			add_location(i0, file$1, 323, 6, 9705);
    			attr_dev(div0, "class", "icon-container svelte-qvnm7r");
    			add_location(div0, file$1, 322, 4, 9645);
    			attr_dev(div1, "class", "nav svelte-qvnm7r");
    			add_location(div1, file$1, 321, 2, 9622);
    			attr_dev(i1, "id", "upDirectory");
    			attr_dev(i1, "class", "svelte-qvnm7r");
    			add_location(i1, file$1, 328, 6, 9846);
    			attr_dev(div2, "class", "icon-container svelte-qvnm7r");
    			add_location(div2, file$1, 327, 4, 9778);
    			attr_dev(div3, "class", "nav svelte-qvnm7r");
    			add_location(div3, file$1, 326, 2, 9755);
    			attr_dev(i2, "id", "backNavigate");
    			attr_dev(i2, "class", "svelte-qvnm7r");
    			add_location(i2, file$1, 336, 6, 10043);
    			attr_dev(div4, "class", "icon-container svelte-qvnm7r");
    			add_location(div4, file$1, 332, 4, 9917);
    			attr_dev(div5, "class", "nav svelte-qvnm7r");
    			add_location(div5, file$1, 331, 2, 9894);
    			attr_dev(i3, "id", "forwardNavigate");
    			attr_dev(i3, "class", "svelte-qvnm7r");
    			add_location(i3, file$1, 341, 6, 10188);
    			attr_dev(div6, "class", "icon-container svelte-qvnm7r");
    			add_location(div6, file$1, 340, 4, 10115);
    			attr_dev(div7, "class", "nav svelte-qvnm7r");
    			add_location(div7, file$1, 339, 2, 10092);
    			attr_dev(div8, "class", "breadcrumbs svelte-qvnm7r");
    			add_location(div8, file$1, 349, 2, 10408);
    			attr_dev(div9, "class", "nav-wrapper svelte-qvnm7r");
    			add_location(div9, file$1, 320, 0, 9593);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div9, t0);
    			append_dev(div9, div3);
    			append_dev(div3, div2);
    			append_dev(div2, i1);
    			append_dev(div9, t1);
    			append_dev(div9, div5);
    			append_dev(div5, div4);
    			append_dev(div4, i2);
    			append_dev(div9, t2);
    			append_dev(div9, div7);
    			append_dev(div7, div6);
    			append_dev(div6, i3);
    			append_dev(div9, t3);
    			append_dev(div9, div8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div8, null);
    			}

    			dispose = [
    				listen_dev(div0, "click", /*selectFolder*/ ctx[1], false, false, false),
    				listen_dev(div2, "click", /*click_handler*/ ctx[19], false, false, false),
    				listen_dev(div4, "click", /*click_handler_1*/ ctx[20], false, false, false),
    				listen_dev(div4, "mouseover", /*mouseover_handler*/ ctx[21], false, false, false),
    				listen_dev(div6, "click", /*click_handler_2*/ ctx[22], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navCrumbObjects, navigate*/ 5) {
    				each_value = /*navCrumbObjects*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function logThis(type, msg) {
    	CustomLogging_3[`${type}`].log(msg);
    	console.log(msg);
    }

    function showHistory() {
    	console.log("show history from back button");
    }

    function instance($$self, $$props, $$invalidate) {
    	let $storeCurrentPath;
    	validate_store(storeCurrentPath, "storeCurrentPath");
    	component_subscribe($$self, storeCurrentPath, $$value => $$invalidate(9, $storeCurrentPath = $$value));
    	CustomLogging_2[0].log("test 0");
    	CustomLogging_2[1].log("test 1");

    	// customStyles[2].log("test 2")
    	// customStyles[3].log("test 3")
    	CustomLogging_3["back"].back("test back");

    	console.log("testing back");
    	CustomLogging_3["forward"].forward("test forward");
    	CustomLogging_4.forward.l("c.l here");
    	logThis("back", "hello hello");

    	// const custom = new CustomLogging();
    	// const error = new CustomLogging("error");
    	// error.setBodyStyle({ color: "red", size: "2rem" });
    	// const special = new CustomLogging("special");
    	// special.setTitleStyle({
    	//   color: "rgba(0,70,255,0.5)",
    	//   size: "1.2rem",
    	//   margin: "0 0 0 1rem"
    	// });
    	// error.log("Something bad happened!");
    	// special.log("I am very special");
    	const dispatch = createEventDispatcher();

    	const fs = require("fs");
    	const electron = require("electron");
    	const BrowserWindow = electron.remote.BrowserWindow;
    	const dialog = electron.remote.dialog;
    	let breadcrumbs = [];
    	let lsCurrentPath;

    	onMount(() => {
    		$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    	});

    	function dispatchNavHistoryTracker() {
    		console.log("function dispatchNavHistoryTracker ", navHistoryTracker);
    		dispatch("nav", { data: navHistoryTracker });
    	}

    	function addNavHistory() {
    		$$invalidate(4, navHistory = [...navHistory, currentPath]);
    		$$invalidate(5, navHistoryTracker = navHistory.length - 1);
    		$$invalidate(7, navHistoryIndex = navHistoryLength - navHistoryTracker);
    		storeNavHistory.set(navHistory);
    	}

    	function selectFolder() {
    		//renderer.js - a renderer process
    		const { remote } = require("electron"),
    			dialog = remote.dialog,
    			WIN = remote.getCurrentWindow();

    		let options = {
    			title: "Select Folder",
    			defaultPath: "C:\\Users\\Mike\\Desktop\\WEB DEV",
    			buttonLabel: "Select Folder",
    			filters: [],
    			properties: ["openDirectory"]
    		};

    		//Synchronous
    		let filePaths = dialog.showOpenDialog(WIN, options);

    		console.log("filePaths, ", filePaths);

    		filePaths.then(res => {
    			if (res.canceled) {
    				return;
    			}

    			set_store_value(storeCurrentPath, $storeCurrentPath = res.filePaths[0]);
    			$$invalidate(8, currentPath = res.filePaths[0]);
    			console.log("currentPath: ", currentPath);
    		});
    	}

    	function navigate(e) {
    		console.log(`\n\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< navigate(e):`);
    		console.log(`\n\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< e = ${typeof e}`);
    		console.log(e);

    		if (e === "back") {
    			if (navHistoryLength < 1) {
    				console.log("no history, exit");
    				return;
    			}

    			$$invalidate(5, navHistoryTracker = navHistoryTracker + 1);
    			console.log("\n\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< back");
    			console.log(`back`);
    			console.log(`navHistoryLength: ${navHistoryLength}`);
    			console.log(`navHistoryTracker: ${navHistoryTracker}`);
    			console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< back\n\n");

    			if (!navHistory[navHistoryIndex]) {
    				console.log("!no more history!");
    				$$invalidate(5, navHistoryTracker = navHistoryTracker - 1);
    				$$invalidate(7, navHistoryIndex = navHistoryLength - navHistoryTracker);
    				return;
    			}

    			dispatchNavHistoryTracker();
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryIndex]);
    			$$invalidate(8, currentPath = navHistory[navHistoryIndex]);
    			$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    		} // addNavHistory();
    		// return;

    		if (e === "forward") {
    			if (navHistoryLength < 1) {
    				console.log("no history, exit");
    				return;
    			}

    			$$invalidate(5, navHistoryTracker = navHistoryTracker - 1);
    			console.log("\n\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< forward");
    			console.log(`forward`);
    			console.log(`navHistoryLength: ${navHistoryLength}`);
    			console.log(`navHistoryTracker: ${navHistoryTracker}`);
    			console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< forward\n\n");
    			$$invalidate(7, navHistoryIndex = navHistoryLength - navHistoryTracker);

    			if (!navHistory[navHistoryIndex]) {
    				console.log("!no more history!");
    				$$invalidate(5, navHistoryTracker = navHistoryTracker + 1);
    				$$invalidate(7, navHistoryIndex = navHistoryLength - navHistoryTracker);
    				return;
    			}

    			console.log(`navHistoryTracker: ${navHistoryTracker}`);
    			console.log(`navHistoryIndex: ${navHistoryIndex}`);
    			console.log(`navHistory[navHistoryIndex]: ${navHistory[navHistoryIndex]}`);
    			dispatchNavHistoryTracker();
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryIndex]);
    			$$invalidate(8, currentPath = navHistory[navHistoryIndex]);
    		} // addNavHistory();
    		// return;

    		if (e === "up") {
    			console.log("up");
    			navCrumbs.pop();
    			(($$invalidate(3, navCrumbs), $$invalidate(8, currentPath)), $$invalidate(9, $storeCurrentPath));
    			$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    			let newPath = navCrumbs.join("\\");
    			console.log("~~~~~~~     newpath ", newPath);
    			console.log("~~~~~~~     navcrumbs ", navCrumbs);

    			// let pathJoin = navCrumbs.joi
    			storeCurrentPath.set(newPath);

    			dispatchNavHistoryTracker();
    			addNavHistory();
    		} // return;

    		if (typeof e === "object") {
    			console.log(`navigate(e) clicked at currentPath ${currentPath}, e.target.textContent ${e.target.textContent}`);

    			// using breadcrumbs navigation, going more than one level back/up
    			let crumb = e.target.textContent.trim();

    			let i = navCrumbs.indexOf(crumb);
    			console.log(`e.target.textContent ${crumb}, index of this crumb: ${i} from navCrumbs ${navCrumbs}`);
    			let dif = navCrumbs.length - i;

    			if (dif > 1) {
    				console.log(`crumbs dif is more than 1`);

    				for (let x = 1; x < dif; x++) {
    					navCrumbs.pop();
    					console.log(`navCrumbs.pop()...ing`);
    				}
    			}

    			(($$invalidate(3, navCrumbs), $$invalidate(8, currentPath)), $$invalidate(9, $storeCurrentPath));
    			let newPath = navCrumbs.join("\\");
    			console.log("~~~~~~~     newpath ", newPath);
    			console.log("~~~~~~~     navcrumbs ", navCrumbs);
    			storeCurrentPath.set(newPath);
    			$$invalidate(8, currentPath = newPath);
    			$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    			dispatchNavHistoryTracker();
    			addNavHistory();
    		}
    	}

    	const click_handler = () => navigate("up");
    	const click_handler_1 = () => navigate("back");
    	const mouseover_handler = () => showHistory();
    	const click_handler_2 = () => navigate("forward");
    	const click_handler_3 = e => navigate(e);

    	$$self.$capture_state = () => ({
    		storeCurrentPath,
    		storeNavHistory,
    		generateColors,
    		onMount,
    		createEventDispatcher,
    		customStyles: CustomLogging_2,
    		customStylesObjects: CustomLogging_3,
    		c: CustomLogging_4,
    		logThis,
    		dispatch,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		breadcrumbs,
    		lsCurrentPath,
    		dispatchNavHistoryTracker,
    		addNavHistory,
    		showHistory,
    		selectFolder,
    		navigate,
    		console,
    		require,
    		navCrumbObjects,
    		navCrumbs,
    		navHistory,
    		navHistoryTracker,
    		navHistoryLength,
    		navHistoryIndex,
    		currentPath,
    		$storeCurrentPath,
    		window
    	});

    	$$self.$inject_state = $$props => {
    		if ("breadcrumbs" in $$props) breadcrumbs = $$props.breadcrumbs;
    		if ("lsCurrentPath" in $$props) lsCurrentPath = $$props.lsCurrentPath;
    		if ("navCrumbObjects" in $$props) $$invalidate(0, navCrumbObjects = $$props.navCrumbObjects);
    		if ("navCrumbs" in $$props) $$invalidate(3, navCrumbs = $$props.navCrumbs);
    		if ("navHistory" in $$props) $$invalidate(4, navHistory = $$props.navHistory);
    		if ("navHistoryTracker" in $$props) $$invalidate(5, navHistoryTracker = $$props.navHistoryTracker);
    		if ("navHistoryLength" in $$props) $$invalidate(6, navHistoryLength = $$props.navHistoryLength);
    		if ("navHistoryIndex" in $$props) $$invalidate(7, navHistoryIndex = $$props.navHistoryIndex);
    		if ("currentPath" in $$props) $$invalidate(8, currentPath = $$props.currentPath);
    	};

    	let navCrumbObjects;
    	let navHistory;
    	let navHistoryTracker;
    	let navHistoryLength;
    	let navHistoryIndex;
    	let currentPath;
    	let navCrumbs;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$storeCurrentPath*/ 512) {
    			 $$invalidate(8, currentPath = $storeCurrentPath);
    		}

    		if ($$self.$$.dirty & /*currentPath*/ 256) {
    			// console.log(`accessing assets: ${currentPath}`);
    			 if (typeof window !== "undefined") {
    				storeCurrentPath.subscribe(path => {
    					$$invalidate(8, currentPath = path);

    					// currentPath = `${path}\\`;
    					console.log("subscription path ", currentPath);
    				});

    				storeNavHistory.subscribe(history => {
    					console.log("navHistory ", history);

    					// navHistoryTracker = 1;
    					$$invalidate(4, navHistory = history);
    				}); // navigate();
    			}
    		}

    		if ($$self.$$.dirty & /*currentPath*/ 256) {
    			 $$invalidate(3, navCrumbs = currentPath.split("\\"));
    		}

    		if ($$self.$$.dirty & /*navCrumbs*/ 8) {
    			 $$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    		}

    		if ($$self.$$.dirty & /*navHistory*/ 16) {
    			 $$invalidate(6, navHistoryLength = navHistory.length);
    		}

    		if ($$self.$$.dirty & /*navHistoryLength, navHistoryTracker*/ 96) {
    			 $$invalidate(7, navHistoryIndex = navHistoryLength - navHistoryTracker - 1);
    		}

    		if ($$self.$$.dirty & /*navHistoryLength, navHistoryTracker, navHistoryIndex*/ 224) {
    			 console.log(`reactive navHistory length: ${navHistoryLength}, navHistoryTracker: ${navHistoryTracker}, navHistoryIndex: ${navHistoryIndex}  `);
    		}
    	};

    	 $$invalidate(4, navHistory = []);
    	 $$invalidate(5, navHistoryTracker = 1);

    	return [
    		navCrumbObjects,
    		selectFolder,
    		navigate,
    		navCrumbs,
    		navHistory,
    		navHistoryTracker,
    		navHistoryLength,
    		navHistoryIndex,
    		currentPath,
    		$storeCurrentPath,
    		dispatch,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		breadcrumbs,
    		lsCurrentPath,
    		dispatchNavHistoryTracker,
    		addNavHistory,
    		click_handler,
    		click_handler_1,
    		mouseover_handler,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\filesystem\fs.svelte generated by Svelte v3.19.1 */
    const file_1 = "src\\filesystem\\fs.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (185:8) {#each currentDirs as dir}
    function create_each_block_1(ctx) {
    	let div;
    	let t0_value = /*dir*/ ctx[19] + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[14](/*dir*/ ctx[19], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "dir " + (/*dir*/ ctx[19][0] == "." ? "dot-dir" : "reg-dir") + " svelte-1d4rth4");
    			add_location(div, file_1, 185, 10, 4818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			dispose = listen_dev(div, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentDirs*/ 2 && t0_value !== (t0_value = /*dir*/ ctx[19] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*currentDirs*/ 2 && div_class_value !== (div_class_value = "dir " + (/*dir*/ ctx[19][0] == "." ? "dot-dir" : "reg-dir") + " svelte-1d4rth4")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(185:8) {#each currentDirs as dir}",
    		ctx
    	});

    	return block;
    }

    // (198:8) {#each currentFiles as file}
    function create_each_block$1(ctx) {
    	let div;
    	let t_value = /*file*/ ctx[16] + "";
    	let t;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[15](/*file*/ ctx[16], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "file svelte-1d4rth4");
    			add_location(div, file_1, 198, 10, 5156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentFiles*/ 1 && t_value !== (t_value = /*file*/ ctx[16] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(198:8) {#each currentFiles as file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t0;
    	let div5;
    	let div1;
    	let h20;
    	let t2;
    	let div0;
    	let t3;
    	let div2;
    	let t5;
    	let div4;
    	let h21;
    	let t7;
    	let div3;
    	let current;
    	const nav = new Navigation({ $$inline: true });
    	nav.$on("nav", /*receiveNavHistoryTracker*/ ctx[2]);
    	let each_value_1 = /*currentDirs*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*currentFiles*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "DIRECTORIES";
    			t2 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			div2.textContent = ".";
    			t5 = space();
    			div4 = element("div");
    			h21 = element("h2");
    			h21.textContent = "FILES";
    			t7 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h20, file_1, 182, 6, 4716);
    			attr_dev(div0, "class", "dirs-listing svelte-1d4rth4");
    			add_location(div0, file_1, 183, 6, 4744);
    			add_location(div1, file_1, 181, 4, 4703);
    			add_location(div2, file_1, 193, 4, 5026);
    			add_location(h21, file_1, 195, 6, 5057);
    			attr_dev(div3, "class", "files-listing svelte-1d4rth4");
    			add_location(div3, file_1, 196, 6, 5079);
    			add_location(div4, file_1, 194, 4, 5044);
    			attr_dev(div5, "class", "file-system svelte-1d4rth4");
    			add_location(div5, file_1, 180, 2, 4672);
    			add_location(main, file_1, 178, 0, 4617);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, div5);
    			append_dev(div5, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, h21);
    			append_dev(div4, t7);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentDirs, navigate*/ 10) {
    				each_value_1 = /*currentDirs*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*fileInfo, currentFiles*/ 1) {
    				each_value = /*currentFiles*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function cropFileName(name) {
    	let split = name.split("\\");
    	let tail = split.pop();
    	return tail;
    }

    function fileInfo(e) {
    	console.log(`fileInfo on ${file}: `, file);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const fs = require("fs");
    	const path = require("path");
    	let currentFiles = [];
    	let currentDirs = [];
    	let navHistory = [];
    	let navHistoryTracker = 1;
    	let oldPath = "";

    	onMount(() => {
    		addNavHistory();
    	});

    	function receiveNavHistoryTracker(e) {
    		console.log("function receiveNavHistoryTracker", e.detail.data);
    		console.log(e);
    		navHistoryTracker = e.detail.data;
    	}

    	function addNavHistory() {
    		if (navHistory[navHistory.length - 1] === currentPath) {
    			return;
    		}

    		navHistory = [...navHistory, currentPath];
    		navHistoryTracker = 1;
    		storeNavHistory.set(navHistory);
    	}

    	function readDirectory() {
    		console.log("readDirectory() path ", currentPath);
    		oldPath = currentPath;
    		$$invalidate(0, currentFiles = []);
    		$$invalidate(1, currentDirs = []);

    		if (currentPath.split("\\").length === 1) {
    			$$invalidate(7, currentPath = currentPath + path.sep);
    		}

    		try {
    			console.log(`inside readDirectory(), try fs.readdirSync(${currentPath})
        .map`);

    			fs.readdirSync(currentPath).map(contents => {
    				return path.join(currentPath, contents);
    			}).filter(isFile);
    		} catch(err) {
    			console.log("node fs readdirSync error!!! Cannot access this folder", err);
    			$$invalidate(7, currentPath = oldPath);
    			storeCurrentPath.set(currentPath);
    		}
    	}

    	const isFile = fileName => {
    		try {
    			if (fs.lstatSync(fileName).isFile()) {
    				$$invalidate(0, currentFiles = [...currentFiles, cropFileName(fileName)]);
    			} else {
    				$$invalidate(1, currentDirs = [...currentDirs, cropFileName(fileName)]);
    			}
    		} catch(err) {
    			
    		} // console.log(`error from lstatsync: `, err);
    	};

    	function navigate(dir, type) {
    		oldPath = currentPath;
    		console.log(`\n\nnavigate clicked here: ${dir}, currentPath: ${currentPath}\n\n`);

    		if (currentPath === "undefined") {
    			$$invalidate(7, currentPath = navHistory[navHistory.length - 1]);
    		} else {
    			if (type === "tail") {
    				console.log(`currentPath type is type ${type}`, currentPath);

    				if (currentPath.split("\\")[1] === "") {
    					$$invalidate(7, currentPath = currentPath + dir);
    					storeCurrentPath.set(currentPath);
    				} else {
    					$$invalidate(7, currentPath = currentPath + "\\" + dir);
    					storeCurrentPath.set(currentPath);
    				}
    			} else {
    				$$invalidate(7, currentPath = dir);
    				console.log("currentPath ", currentPath);
    				storeCurrentPath.set(currentPath);
    			}

    			readDirectory();
    			addNavHistory();
    		}
    	}

    	const click_handler = dir => navigate(dir, "tail");
    	const click_handler_1 = file => fileInfo();

    	$$self.$capture_state = () => ({
    		Nav: Navigation,
    		onMount,
    		storeCurrentPath,
    		storeNavHistory,
    		generateColors,
    		fs,
    		path,
    		currentFiles,
    		currentDirs,
    		navHistory,
    		navHistoryTracker,
    		oldPath,
    		receiveNavHistoryTracker,
    		addNavHistory,
    		readDirectory,
    		cropFileName,
    		isFile,
    		fileInfo,
    		navigate,
    		require,
    		currentPath,
    		process,
    		root,
    		window,
    		console,
    		file
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentFiles" in $$props) $$invalidate(0, currentFiles = $$props.currentFiles);
    		if ("currentDirs" in $$props) $$invalidate(1, currentDirs = $$props.currentDirs);
    		if ("navHistory" in $$props) navHistory = $$props.navHistory;
    		if ("navHistoryTracker" in $$props) navHistoryTracker = $$props.navHistoryTracker;
    		if ("oldPath" in $$props) oldPath = $$props.oldPath;
    		if ("currentPath" in $$props) $$invalidate(7, currentPath = $$props.currentPath);
    		if ("root" in $$props) root = $$props.root;
    	};

    	let currentPath;
    	let root;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentPath*/ 128) {
    			// $: currentPath = process.cwd();
    			 root = fs.readdirSync(currentPath);
    		}
    	};

    	 $$invalidate(7, currentPath = process.cwd());

    	 if (typeof window !== "undefined") {
    		storeCurrentPath.subscribe(path => {
    			$$invalidate(7, currentPath = path);
    			console.log("subscription path ", path);
    			readDirectory();
    		});

    		storeNavHistory.subscribe(history => {
    			// console.log("navHistory ", history);
    			navHistory = history;
    		});
    	}

    	return [
    		currentFiles,
    		currentDirs,
    		receiveNavHistoryTracker,
    		navigate,
    		navHistory,
    		navHistoryTracker,
    		oldPath,
    		currentPath,
    		root,
    		fs,
    		path,
    		addNavHistory,
    		readDirectory,
    		isFile,
    		click_handler,
    		click_handler_1
    	];
    }

    class Fs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fs",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.1 */
    const file$2 = "src\\App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let current;
    	const fs = new Fs({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Dev Workbench";
    			t1 = space();
    			create_component(fs.$$.fragment);
    			attr_dev(h1, "class", "svelte-19xyxbs");
    			add_location(h1, file$2, 40, 2, 1057);
    			attr_dev(main, "class", "svelte-19xyxbs");
    			add_location(main, file$2, 39, 0, 1047);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(fs, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(fs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ storeCurrentPath, FS: Fs, CustomLogging: CustomLogging_1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Michael'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
