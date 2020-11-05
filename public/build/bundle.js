
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
      // console.log("generateColors, navCrumbs: ", navCrumbs);
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
          weight: "bold",
          size: "1rem",
          margin: "0.5rem 0",
          before: ">>>",
          after: "$$$",
        };

        this.body = {
          color: "rgba(0,0,0,1)",
          size: "1rem",
          padding: "0 1rem 1rem 0",
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
          `%c${this.title.before} ${this.title.body} ${this.title.after} %c${body}`,
          `color: ${this.title.color}; font-weight: ${this.title.weight}; font-size: ${this.title.size}; margin: ${this.title.margin}; padding: ${this.title.padding};`,
          `color: ${this.body.color}; font-weight: normal; font-size: ${this.body.size};  margin: ${this.body.margin}; padding: ${this.body.padding}; font-family: sans-serif;`
        );
      }
    }
    let color;

    const up = new CustomLogging("up");
    color = "rgba(0,170,255,0.95)";
    up.setTitleStyle({
      color: color,
      size: "1.2rem",
      margin: "0",
      before: "^^^",
      after: "^^^\n",
    });
    up.setBodyStyle({
      color: color,
      size: "1.2rem",
      padding: "0 1rem 1rem 0",
    });

    const back = new CustomLogging("back");
    color = "rgba(150,70,55,0.95)";
    back.setTitleStyle({
      color: color,
      size: "1.2rem",
      margin: "0 0 0 0",
      before: "<<<",
      after: "<<<\n",
    });
    back.setBodyStyle({
      color: color,
      size: "1rem",
      padding: "1rem",padding: "0 1rem 1rem 0",});


    const forward = new CustomLogging("forward");
    color = "rgba(150,70,255,0.95)";
    forward.setTitleStyle({
      color: color,
      size: "1.2rem",
      margin: "0 0 0 0",
      before: ">>>",
      after: ">>>\n",
    });
    forward.setBodyStyle({
      color: color,
      size: "1rem",
      padding: "0 1rem 1rem 0",
    });


    const crumbs = new CustomLogging("crumbs");
    color = "rgba(90,70,255,1)";
    crumbs.setTitleStyle({
      color: color,
      size: "1.2rem",
      margin: "0 0 0 0",
      before: "...",
      after: "...\n",
    });
    crumbs.setBodyStyle({
      color: color,
      size: "1rem",
      padding: "0 1rem 1rem 0",
    });

    const error = new CustomLogging("error");
    color = "rgba(255,70,70,0.95)";
    error.setTitleStyle({
      color: color,
      size: "1.2rem",
      margin: "0 0 0 0",
      before: "!",
      after: "!\n",
    });
    error.setBodyStyle({
      color: color,
      size: "1rem",
      padding: "0 1rem 1rem 0",
    });


    const data = new CustomLogging("data");
    color = "rgba(255,70,70,0.95)";
    data.setTitleStyle({
      color: color,
      weight: "normal",
      size: "1.2rem",
      margin: "0 0 0 0",
      before: "$",
      after: "$\n",
    });
    data.setBodyStyle({
      color: color,
      size: "1rem",
      padding: "0 1rem 1rem 0",
    });

    let customStylesObjects = {
      error: error,
      up: up,
      back: back,
      forward: forward,
      crumbs: crumbs,
      data: data
    };

    var CustomLogging_1 = { customStylesObjects };
    var CustomLogging_2 = CustomLogging_1.customStylesObjects;

    /* src\filesystem\navigation.svelte generated by Svelte v3.19.1 */
    const file$1 = "src\\filesystem\\navigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (352:4) {#each navCrumbObjects as crumb, i}
    function create_each_block(ctx) {
    	let span;
    	let t0_value = /*crumb*/ ctx[25].name + "";
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
    			attr_dev(span, "style", span_style_value = /*crumb*/ ctx[25].color);
    			attr_dev(span, "index", span_index_value = /*i*/ ctx[27]);
    			add_location(span, file$1, 352, 6, 9927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			dispose = listen_dev(span, "click", /*click_handler_3*/ ctx[24], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navCrumbObjects*/ 1 && t0_value !== (t0_value = /*crumb*/ ctx[25].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*navCrumbObjects*/ 1 && span_style_value !== (span_style_value = /*crumb*/ ctx[25].color)) {
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
    		source: "(352:4) {#each navCrumbObjects as crumb, i}",
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
    			add_location(i0, file$1, 318, 6, 9019);
    			attr_dev(div0, "class", "icon-container svelte-qvnm7r");
    			add_location(div0, file$1, 317, 4, 8959);
    			attr_dev(div1, "class", "nav svelte-qvnm7r");
    			add_location(div1, file$1, 316, 2, 8936);
    			attr_dev(i1, "id", "upDirectory");
    			attr_dev(i1, "class", "svelte-qvnm7r");
    			add_location(i1, file$1, 326, 6, 9220);
    			attr_dev(div2, "class", "icon-container svelte-qvnm7r");
    			add_location(div2, file$1, 322, 4, 9092);
    			attr_dev(div3, "class", "nav svelte-qvnm7r");
    			add_location(div3, file$1, 321, 2, 9069);
    			attr_dev(i2, "id", "backNavigate");
    			attr_dev(i2, "class", "svelte-qvnm7r");
    			add_location(i2, file$1, 334, 6, 9423);
    			attr_dev(div4, "class", "icon-container svelte-qvnm7r");
    			add_location(div4, file$1, 330, 4, 9291);
    			attr_dev(div5, "class", "nav svelte-qvnm7r");
    			add_location(div5, file$1, 329, 2, 9268);
    			attr_dev(i3, "id", "forwardNavigate");
    			attr_dev(i3, "class", "svelte-qvnm7r");
    			add_location(i3, file$1, 342, 6, 9633);
    			attr_dev(div6, "class", "icon-container svelte-qvnm7r");
    			add_location(div6, file$1, 338, 4, 9495);
    			attr_dev(div7, "class", "nav svelte-qvnm7r");
    			add_location(div7, file$1, 337, 2, 9472);
    			attr_dev(div8, "class", "breadcrumbs svelte-qvnm7r");
    			add_location(div8, file$1, 350, 2, 9853);
    			attr_dev(div9, "class", "nav-wrapper svelte-qvnm7r");
    			add_location(div9, file$1, 315, 0, 8907);
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
    				listen_dev(div2, "click", /*click_handler*/ ctx[18], false, false, false),
    				listen_dev(div2, "mouseover", /*mouseover_handler*/ ctx[19], false, false, false),
    				listen_dev(div4, "click", /*click_handler_1*/ ctx[20], false, false, false),
    				listen_dev(div4, "mouseover", /*mouseover_handler_1*/ ctx[21], false, false, false),
    				listen_dev(div6, "click", /*click_handler_2*/ ctx[22], false, false, false),
    				listen_dev(div6, "mouseover", /*mouseover_handler_2*/ ctx[23], false, false, false)
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

    function log(type, msg) {
    	CustomLogging_2[`${type}`].log(msg);
    	console.log(msg);
    }

    function hoverButton(msg) {
    	console.log(`hovering ${msg} button`);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $storeCurrentPath;
    	validate_store(storeCurrentPath, "storeCurrentPath");
    	component_subscribe($$self, storeCurrentPath, $$value => $$invalidate(8, $storeCurrentPath = $$value));
    	const dispatch = createEventDispatcher();
    	const fs = require("fs");
    	const electron = require("electron");
    	const BrowserWindow = electron.remote.BrowserWindow;
    	const dialog = electron.remote.dialog;
    	let breadcrumbs = [];
    	let lsCurrentPath;
    	let currentPath;
    	let navCrumbs;

    	onMount(() => {
    		$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    	});

    	function dispatchNavHistoryLocation() {
    		log("data", `function dispatchNavHistoryLocation, ${navHistoryLocation}`);
    		dispatch("nav", { data: navHistoryLocation });
    	}

    	function addNavHistory() {
    		$$invalidate(5, navHistory = [
    			...navHistory,
    			{
    				index: navHistory.length + 1,
    				path: currentPath
    			}
    		]);

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
    			$$invalidate(6, navHistoryLocation = navHistoryLocation + 1);

    			// currentPath = res.filePaths[0];
    			log("data", `currentPath from selectFolder: ${currentPath}`);

    			addNavHistory();
    		});
    	}

    	function navigate(e) {
    		console.log(`navigate called with e: ${e}`);

    		if (e === "back") {
    			if (navHistoryLength < 1) {
    				log("error", "no history exists");
    				return;
    			}

    			log("back", `navHistoryLength: ${navHistoryLength}, navHistoryLocation: ${navHistoryLocation}`);

    			if (navHistoryLocation === 0) {
    				log("error", `End of the line! current history length: ${navHistoryLength} current history location ${navHistoryLocation}`);
    			} else {
    				$$invalidate(6, navHistoryLocation = navHistoryLocation - 1);
    			}

    			if (!navHistory[navHistoryLocation]) {
    				log("error", `End of the line! current history length: ${navHistoryLength} current history location ${navHistoryLocation}`);
    				return;
    			}

    			dispatchNavHistoryLocation();
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryLocation].path);
    			$$invalidate(3, currentPath = navHistory[navHistoryLocation]);
    		} // navCrumbObjects = generateColors(navCrumbs);

    		if (e === "forward") {
    			if (navHistoryLength < 1) {
    				log("error", "no history exists");
    				return;
    			}

    			log("forward", `navHistoryLength: ${navHistoryLength}, navHistoryLocation: ${navHistoryLocation}`);

    			if (navHistoryLocation === navHistoryLength - 1) {
    				log("error", `End of the line! current history length: ${navHistoryLength} current history location ${navHistoryLocation}`);
    			} else {
    				$$invalidate(6, navHistoryLocation = navHistoryLocation + 1);
    			}

    			if (!navHistory[navHistoryLocation]) {
    				log("error", `End of the line! current history length: ${navHistoryLength} current history location ${navHistoryLocation}`);
    				return;
    			}

    			dispatchNavHistoryLocation();
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryLocation].path);
    			$$invalidate(3, currentPath = navHistory[navHistoryLocation]);
    		} // addNavHistory();
    		// return;

    		if (e === "up") {
    			log("up", navCrumbs);
    			navCrumbs.pop();
    			(($$invalidate(4, navCrumbs), $$invalidate(3, currentPath)), $$invalidate(8, $storeCurrentPath));
    			$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    			let newPath = navCrumbs.join("\\");
    			console.log("~~~~~~~     newpath ", newPath);
    			console.log("~~~~~~~     navcrumbs ", navCrumbs);

    			// let pathJoin = navCrumbs.joi
    			storeCurrentPath.set(newPath);

    			dispatchNavHistoryLocation();
    			addNavHistory();
    		} // return;

    		if (typeof e === "object") {
    			log("crumbs", currentPath);
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

    			(($$invalidate(4, navCrumbs), $$invalidate(3, currentPath)), $$invalidate(8, $storeCurrentPath));
    			let newPath = navCrumbs.join("\\");
    			console.log("~~~~~~~     newpath ", newPath);
    			console.log("~~~~~~~     navcrumbs ", navCrumbs);
    			storeCurrentPath.set(newPath);
    			$$invalidate(3, currentPath = newPath);
    			$$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    			dispatchNavHistoryLocation();
    			addNavHistory();
    		}
    	} // dispatchNavHistoryLocation();

    	const click_handler = () => navigate("up");
    	const mouseover_handler = () => hoverButton("up");
    	const click_handler_1 = () => navigate("back");
    	const mouseover_handler_1 = () => hoverButton("back");
    	const click_handler_2 = () => navigate("forward");
    	const mouseover_handler_2 = () => hoverButton("forward");
    	const click_handler_3 = e => navigate(e);

    	$$self.$capture_state = () => ({
    		storeCurrentPath,
    		storeNavHistory,
    		generateColors,
    		onMount,
    		createEventDispatcher,
    		customStylesObjects: CustomLogging_2,
    		log,
    		dispatch,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		breadcrumbs,
    		lsCurrentPath,
    		currentPath,
    		navCrumbs,
    		dispatchNavHistoryLocation,
    		addNavHistory,
    		hoverButton,
    		selectFolder,
    		navigate,
    		console,
    		require,
    		navCrumbObjects,
    		navHistory,
    		navHistoryLocation,
    		navHistoryLength,
    		$storeCurrentPath,
    		window
    	});

    	$$self.$inject_state = $$props => {
    		if ("breadcrumbs" in $$props) breadcrumbs = $$props.breadcrumbs;
    		if ("lsCurrentPath" in $$props) lsCurrentPath = $$props.lsCurrentPath;
    		if ("currentPath" in $$props) $$invalidate(3, currentPath = $$props.currentPath);
    		if ("navCrumbs" in $$props) $$invalidate(4, navCrumbs = $$props.navCrumbs);
    		if ("navCrumbObjects" in $$props) $$invalidate(0, navCrumbObjects = $$props.navCrumbObjects);
    		if ("navHistory" in $$props) $$invalidate(5, navHistory = $$props.navHistory);
    		if ("navHistoryLocation" in $$props) $$invalidate(6, navHistoryLocation = $$props.navHistoryLocation);
    		if ("navHistoryLength" in $$props) $$invalidate(7, navHistoryLength = $$props.navHistoryLength);
    	};

    	let navCrumbObjects;
    	let navHistory;
    	let navHistoryLocation;
    	let navHistoryLength;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$storeCurrentPath, currentPath*/ 264) {
    			 {
    				$$invalidate(3, currentPath = $storeCurrentPath);
    				log("data", `currentPath = $storeCurrentPath ${currentPath}`);
    			}
    		}

    		if ($$self.$$.dirty & /*currentPath, navCrumbs*/ 24) {
    			 {
    				$$invalidate(4, navCrumbs = currentPath.split("\\"));
    				log("data", `navCrumbs reactive update: ${navCrumbs}`);
    			}
    		}

    		if ($$self.$$.dirty & /*navCrumbs*/ 16) {
    			 $$invalidate(0, navCrumbObjects = generateColors(navCrumbs));
    		}

    		if ($$self.$$.dirty & /*navHistory*/ 32) {
    			 $$invalidate(6, navHistoryLocation = navHistory.length - 1);
    		}

    		if ($$self.$$.dirty & /*navHistory*/ 32) {
    			 $$invalidate(7, navHistoryLength = navHistory.length);
    		}

    		if ($$self.$$.dirty & /*navHistoryLength, navHistoryLocation*/ 192) {
    			// $: navHistoryIndex = navHistoryLength - navHistoryLocation - 1;
    			 log("data", `reactive navHistory length: ${navHistoryLength}, navHistoryLocation: ${navHistoryLocation}`);
    		}
    	};

    	 if (typeof window !== "undefined") {
    		storeCurrentPath.subscribe(data => {
    			$$invalidate(3, currentPath = data);

    			// currentPath = `${path}\\`;
    			console.log("subscription path data ", data);
    		});

    		storeNavHistory.subscribe(history => {
    			// log("data", "storeNavHistory called in navigation.svelte subscription");
    			// navHistoryLocation = 1;
    			$$invalidate(5, navHistory = history);
    		}); // navigate();
    	}

    	 $$invalidate(5, navHistory = []);

    	return [
    		navCrumbObjects,
    		selectFolder,
    		navigate,
    		currentPath,
    		navCrumbs,
    		navHistory,
    		navHistoryLocation,
    		navHistoryLength,
    		$storeCurrentPath,
    		dispatch,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		breadcrumbs,
    		lsCurrentPath,
    		dispatchNavHistoryLocation,
    		addNavHistory,
    		click_handler,
    		mouseover_handler,
    		click_handler_1,
    		mouseover_handler_1,
    		click_handler_2,
    		mouseover_handler_2,
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
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (204:8) {#each currentDirs as dir}
    function create_each_block_2(ctx) {
    	let div;
    	let t0_value = /*dir*/ ctx[20] + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[14](/*dir*/ ctx[20], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "dir " + (/*dir*/ ctx[20][0] == "." ? "dot-dir" : "reg-dir") + " svelte-1a8nd4b");
    			add_location(div, file_1, 204, 10, 5293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			dispose = listen_dev(div, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentDirs*/ 2 && t0_value !== (t0_value = /*dir*/ ctx[20] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*currentDirs*/ 2 && div_class_value !== (div_class_value = "dir " + (/*dir*/ ctx[20][0] == "." ? "dot-dir" : "reg-dir") + " svelte-1a8nd4b")) {
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(204:8) {#each currentDirs as dir}",
    		ctx
    	});

    	return block;
    }

    // (218:8) {#each navHistory as dir, i}
    function create_each_block_1(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*dir*/ ctx[20].index + "";
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = /*dir*/ ctx[20].path + "";
    	let t4;
    	let t5;
    	let div2_class_value;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[15](/*dir*/ ctx[20], ...args);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(/*i*/ ctx[22]);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(div0, "class", "historyIndex svelte-1a8nd4b");
    			add_location(div0, file_1, 218, 10, 5705);
    			attr_dev(div1, "class", "historyIndex svelte-1a8nd4b");
    			add_location(div1, file_1, 219, 10, 5752);

    			attr_dev(div2, "class", div2_class_value = "dir i " + (/*navHistoryLocation*/ ctx[3] === /*i*/ ctx[22]
    			? "special"
    			: "none") + " svelte-1a8nd4b");

    			add_location(div2, file_1, 220, 10, 5807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t4);
    			append_dev(div2, t5);
    			dispose = listen_dev(div2, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*navHistory*/ 4 && t2_value !== (t2_value = /*dir*/ ctx[20].index + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*navHistory*/ 4 && t4_value !== (t4_value = /*dir*/ ctx[20].path + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*navHistoryLocation*/ 8 && div2_class_value !== (div2_class_value = "dir i " + (/*navHistoryLocation*/ ctx[3] === /*i*/ ctx[22]
    			? "special"
    			: "none") + " svelte-1a8nd4b")) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(218:8) {#each navHistory as dir, i}",
    		ctx
    	});

    	return block;
    }

    // (232:8) {#each currentFiles as file}
    function create_each_block$1(ctx) {
    	let div;
    	let t_value = /*file*/ ctx[17] + "";
    	let t;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[16](/*file*/ ctx[17], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "file svelte-1a8nd4b");
    			add_location(div, file_1, 232, 10, 6149);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", click_handler_2, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentFiles*/ 1 && t_value !== (t_value = /*file*/ ctx[17] + "")) set_data_dev(t, t_value);
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
    		source: "(232:8) {#each currentFiles as file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t0;
    	let div7;
    	let div1;
    	let h20;
    	let t2;
    	let div0;
    	let t3;
    	let div3;
    	let h21;
    	let t5;
    	let h1;
    	let t7;
    	let p;
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let div5;
    	let h22;
    	let t12;
    	let div4;
    	let t13;
    	let div6;
    	let current;
    	const nav = new Navigation({ $$inline: true });
    	nav.$on("nav", /*receiveNavHistoryLocation*/ ctx[4]);
    	let each_value_2 = /*currentDirs*/ ctx[1];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*navHistory*/ ctx[2];
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
    			div7 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "DIRECTORIES";
    			t2 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t3 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			h21.textContent = "History";
    			t5 = space();
    			h1 = element("h1");
    			h1.textContent = "Nav History Location Index:";
    			t7 = space();
    			p = element("p");
    			t8 = text(/*navHistoryLocation*/ ctx[3]);
    			t9 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			div5 = element("div");
    			h22 = element("h2");
    			h22.textContent = "FILES";
    			t12 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			div6 = element("div");
    			add_location(h20, file_1, 201, 6, 5191);
    			attr_dev(div0, "class", "dirs-listing svelte-1a8nd4b");
    			add_location(div0, file_1, 202, 6, 5219);
    			add_location(div1, file_1, 200, 4, 5178);
    			add_location(h21, file_1, 213, 6, 5523);
    			add_location(h1, file_1, 214, 6, 5547);
    			add_location(p, file_1, 215, 6, 5591);
    			attr_dev(div2, "class", "history-listing svelte-1a8nd4b");
    			add_location(div2, file_1, 216, 6, 5626);
    			add_location(div3, file_1, 212, 4, 5510);
    			add_location(h22, file_1, 229, 6, 6050);
    			attr_dev(div4, "class", "files-listing svelte-1a8nd4b");
    			add_location(div4, file_1, 230, 6, 6072);
    			add_location(div5, file_1, 228, 4, 6037);
    			add_location(div6, file_1, 238, 4, 6283);
    			attr_dev(div7, "class", "file-system svelte-1a8nd4b");
    			add_location(div7, file_1, 199, 2, 5147);
    			add_location(main, file_1, 197, 0, 5091);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, div7);
    			append_dev(div7, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(div7, t3);
    			append_dev(div7, div3);
    			append_dev(div3, h21);
    			append_dev(div3, t5);
    			append_dev(div3, h1);
    			append_dev(div3, t7);
    			append_dev(div3, p);
    			append_dev(p, t8);
    			append_dev(div3, t9);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(div7, t10);
    			append_dev(div7, div5);
    			append_dev(div5, h22);
    			append_dev(div5, t12);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			append_dev(div7, t13);
    			append_dev(div7, div6);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentDirs, navigate*/ 34) {
    				each_value_2 = /*currentDirs*/ ctx[1];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (!current || dirty & /*navHistoryLocation*/ 8) set_data_dev(t8, /*navHistoryLocation*/ ctx[3]);

    			if (dirty & /*navHistoryLocation, navigate, navHistory*/ 44) {
    				each_value_1 = /*navHistory*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, null);
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
    						each_blocks[i].m(div4, null);
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
    			destroy_each(each_blocks_2, detaching);
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
    	let oldPath = "";

    	onMount(() => {
    		console.log("onMount fs.svelte");
    		addNavHistory();
    	});

    	function receiveNavHistoryLocation(e) {
    		console.log("function receiveNavHistoryLocation", e.detail.data);
    		console.log(e);
    		$$invalidate(3, navHistoryLocation = e.detail.data);
    	}

    	function addNavHistory() {
    		if (navHistory[navHistory.length - 1] === currentPath) {
    			return;
    		}

    		$$invalidate(2, navHistory = [
    			...navHistory,
    			{
    				index: navHistory.length,
    				path: currentPath
    			}
    		]);

    		$$invalidate(3, navHistoryLocation = 1);
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
    			$$invalidate(7, currentPath = navHistory[navHistory.length - 1].path);
    		} else {
    			if (type === "directoryItem") {
    				console.log(`currentPath type is type ${type}`, currentPath);

    				if (currentPath.split("\\")[1] === "") {
    					$$invalidate(7, currentPath = currentPath + dir);
    					storeCurrentPath.set(currentPath);
    				} else {
    					$$invalidate(7, currentPath = currentPath + "\\" + dir);
    					storeCurrentPath.set(currentPath);
    				}
    			} else {
    				$$invalidate(7, currentPath = dir.path);
    				console.log("currentPath ", currentPath);
    				storeCurrentPath.set(currentPath);
    			}

    			readDirectory();
    			addNavHistory();
    		}
    	}

    	const click_handler = dir => navigate(dir, "directoryItem");
    	const click_handler_1 = dir => navigate(dir, "historyItem");
    	const click_handler_2 = file => fileInfo();

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
    		oldPath,
    		receiveNavHistoryLocation,
    		addNavHistory,
    		readDirectory,
    		cropFileName,
    		isFile,
    		fileInfo,
    		navigate,
    		require,
    		navHistoryLocation,
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
    		if ("navHistory" in $$props) $$invalidate(2, navHistory = $$props.navHistory);
    		if ("oldPath" in $$props) oldPath = $$props.oldPath;
    		if ("navHistoryLocation" in $$props) $$invalidate(3, navHistoryLocation = $$props.navHistoryLocation);
    		if ("currentPath" in $$props) $$invalidate(7, currentPath = $$props.currentPath);
    		if ("root" in $$props) root = $$props.root;
    	};

    	let navHistoryLocation;
    	let currentPath;
    	let root;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*navHistory*/ 4) {
    			 $$invalidate(3, navHistoryLocation = navHistory.length - 1);
    		}

    		if ($$self.$$.dirty & /*currentPath*/ 128) {
    			 root = fs.readdirSync(currentPath);
    		}
    	};

    	 if (typeof window !== "undefined") {
    		storeCurrentPath.subscribe(data => {
    			$$invalidate(7, currentPath = data);
    			console.log("subscription path ", data);
    			readDirectory();
    		});

    		storeNavHistory.subscribe(history => {
    			// console.log("navHistory ", history);
    			$$invalidate(2, navHistory = history);
    		});
    	}

    	 $$invalidate(7, currentPath = process.cwd());

    	return [
    		currentFiles,
    		currentDirs,
    		navHistory,
    		navHistoryLocation,
    		receiveNavHistoryLocation,
    		navigate,
    		oldPath,
    		currentPath,
    		root,
    		fs,
    		path,
    		addNavHistory,
    		readDirectory,
    		isFile,
    		click_handler,
    		click_handler_1,
    		click_handler_2
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
    			add_location(h1, file$2, 56, 2, 1205);
    			attr_dev(main, "class", "svelte-19xyxbs");
    			add_location(main, file$2, 55, 0, 1195);
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
    	const { remote } = require("electron");
    	const { Menu, MenuItem } = remote;
    	let rightClickPosition = null;
    	const menu = new Menu();

    	const menuItem = new MenuItem({
    			label: "Inspect Element",
    			click: () => {
    				remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y);
    			}
    		});

    	menu.append(menuItem);

    	// end 'Inspect Element' menu
    	window.addEventListener(
    		"contextmenu",
    		e => {
    			e.preventDefault();
    			rightClickPosition = { x: e.x, y: e.y };
    			menu.popup(remote.getCurrentWindow());
    		},
    		false
    	);

    	$$self.$capture_state = () => ({
    		storeCurrentPath,
    		FS: Fs,
    		CustomLogging: CustomLogging_1,
    		remote,
    		Menu,
    		MenuItem,
    		rightClickPosition,
    		menu,
    		menuItem,
    		require,
    		window
    	});

    	$$self.$inject_state = $$props => {
    		if ("rightClickPosition" in $$props) rightClickPosition = $$props.rightClickPosition;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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
