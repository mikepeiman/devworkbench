
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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

    // const exec = require('child_process').exec

    // exec('node .', (err, stdout, stderr) => console.log(stdout))

    const exec = require('child_process').exec;

    let runner = () => {
      exec('notepad.exe', (err, stdout, stderr) => console.log(stdout));
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
    const file = "src\\filesystem\\navigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (369:4) {#each navCrumbObjects as crumb, i}
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
    			attr_dev(span, "class", "breadcrumb svelte-t7gb48");
    			attr_dev(span, "style", span_style_value = /*crumb*/ ctx[25].color);
    			attr_dev(span, "index", span_index_value = /*i*/ ctx[27]);
    			add_location(span, file, 369, 6, 10453);
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
    		source: "(369:4) {#each navCrumbObjects as crumb, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div11;
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
    	let div9;
    	let div8;
    	let i4;
    	let t4;
    	let div10;
    	let dispose;
    	let each_value = /*navCrumbObjects*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div11 = element("div");
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
    			div9 = element("div");
    			div8 = element("div");
    			i4 = element("i");
    			t4 = space();
    			div10 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i0, "id", "childProcess");
    			attr_dev(i0, "class", "svelte-t7gb48");
    			add_location(i0, file, 330, 6, 9413);
    			attr_dev(div0, "class", "icon-container svelte-t7gb48");
    			add_location(div0, file, 329, 4, 9353);
    			attr_dev(div1, "class", "nav svelte-t7gb48");
    			add_location(div1, file, 328, 2, 9330);
    			attr_dev(i1, "id", "openDirectory");
    			attr_dev(i1, "class", "svelte-t7gb48");
    			add_location(i1, file, 335, 6, 9545);
    			attr_dev(div2, "class", "icon-container svelte-t7gb48");
    			add_location(div2, file, 334, 4, 9485);
    			attr_dev(div3, "class", "nav svelte-t7gb48");
    			add_location(div3, file, 333, 2, 9462);
    			attr_dev(i2, "id", "upDirectory");
    			attr_dev(i2, "class", "svelte-t7gb48");
    			add_location(i2, file, 343, 6, 9746);
    			attr_dev(div4, "class", "icon-container svelte-t7gb48");
    			add_location(div4, file, 339, 4, 9618);
    			attr_dev(div5, "class", "nav svelte-t7gb48");
    			add_location(div5, file, 338, 2, 9595);
    			attr_dev(i3, "id", "backNavigate");
    			attr_dev(i3, "class", "svelte-t7gb48");
    			add_location(i3, file, 351, 6, 9949);
    			attr_dev(div6, "class", "icon-container svelte-t7gb48");
    			add_location(div6, file, 347, 4, 9817);
    			attr_dev(div7, "class", "nav svelte-t7gb48");
    			add_location(div7, file, 346, 2, 9794);
    			attr_dev(i4, "id", "forwardNavigate");
    			attr_dev(i4, "class", "svelte-t7gb48");
    			add_location(i4, file, 359, 6, 10159);
    			attr_dev(div8, "class", "icon-container svelte-t7gb48");
    			add_location(div8, file, 355, 4, 10021);
    			attr_dev(div9, "class", "nav svelte-t7gb48");
    			add_location(div9, file, 354, 2, 9998);
    			attr_dev(div10, "class", "breadcrumbs svelte-t7gb48");
    			add_location(div10, file, 367, 2, 10379);
    			attr_dev(div11, "class", "nav-wrapper svelte-t7gb48");
    			add_location(div11, file, 327, 0, 9301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div11, t0);
    			append_dev(div11, div3);
    			append_dev(div3, div2);
    			append_dev(div2, i1);
    			append_dev(div11, t1);
    			append_dev(div11, div5);
    			append_dev(div5, div4);
    			append_dev(div4, i2);
    			append_dev(div11, t2);
    			append_dev(div11, div7);
    			append_dev(div7, div6);
    			append_dev(div6, i3);
    			append_dev(div11, t3);
    			append_dev(div11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, i4);
    			append_dev(div11, t4);
    			append_dev(div11, div10);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div10, null);
    			}

    			dispose = [
    				listen_dev(div0, "click", childProcess, false, false, false),
    				listen_dev(div2, "click", /*selectFolder*/ ctx[1], false, false, false),
    				listen_dev(div4, "click", /*click_handler*/ ctx[18], false, false, false),
    				listen_dev(div4, "mouseover", /*mouseover_handler*/ ctx[19], false, false, false),
    				listen_dev(div6, "click", /*click_handler_1*/ ctx[20], false, false, false),
    				listen_dev(div6, "mouseover", /*mouseover_handler_1*/ ctx[21], false, false, false),
    				listen_dev(div8, "click", /*click_handler_2*/ ctx[22], false, false, false),
    				listen_dev(div8, "mouseover", /*mouseover_handler_2*/ ctx[23], false, false, false)
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
    						each_blocks[i].m(div10, null);
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
    			if (detaching) detach_dev(div11);
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

    function childProcess() {
    	const exec = require("child_process").exec;
    	exec("notepad.exe", (err, stdout, stderr) => console.log(stdout));
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
    		$$invalidate(5, navHistory = [...navHistory, currentPath]);
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
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryLocation]);
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
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryLocation]);
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
    		runner,
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
    		childProcess,
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
    const file$1 = "src\\filesystem\\fs.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (368:12) {#if current === dir}
    function create_if_block(ctx) {
    	let i;
    	let dispose;

    	function mouseover_handler(...args) {
    		return /*mouseover_handler*/ ctx[23](/*dir*/ ctx[12], ...args);
    	}

    	function mouseout_handler(...args) {
    		return /*mouseout_handler*/ ctx[24](/*dir*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "addFavorite svelte-568287");
    			add_location(i, file$1, 372, 14, 9843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			dispose = [
    				listen_dev(i, "mouseover", mouseover_handler, false, false, false),
    				listen_dev(i, "mouseout", mouseout_handler, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(368:12) {#if current === dir}",
    		ctx
    	});

    	return block;
    }

    // (360:8) {#each currentDirs as dir}
    function create_each_block_3(ctx) {
    	let div;
    	let t0_value = /*dir*/ ctx[12] + "";
    	let t0;
    	let t1;
    	let t2;
    	let div_class_value;
    	let dispose;
    	let if_block = /*current*/ ctx[0] === /*dir*/ ctx[12] && create_if_block(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[25](/*dir*/ ctx[12], ...args);
    	}

    	function mouseover_handler_1(...args) {
    		return /*mouseover_handler_1*/ ctx[26](/*dir*/ ctx[12], ...args);
    	}

    	function mouseout_handler_1(...args) {
    		return /*mouseout_handler_1*/ ctx[27](/*dir*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(div, "class", div_class_value = "dir " + (/*dir*/ ctx[12][0] == "." ? "dot-dir" : "reg-dir") + " svelte-568287");
    			toggle_class(div, "hovered", /*current*/ ctx[0] === /*dir*/ ctx[12]);
    			add_location(div, file$1, 360, 10, 9300);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);

    			dispose = [
    				listen_dev(div, "click", click_handler, false, false, false),
    				listen_dev(div, "mouseover", mouseover_handler_1, false, false, false),
    				listen_dev(div, "mouseout", mouseout_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*currentDirs*/ 4 && t0_value !== (t0_value = /*dir*/ ctx[12] + "")) set_data_dev(t0, t0_value);

    			if (/*current*/ ctx[0] === /*dir*/ ctx[12]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*currentDirs*/ 4 && div_class_value !== (div_class_value = "dir " + (/*dir*/ ctx[12][0] == "." ? "dot-dir" : "reg-dir") + " svelte-568287")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty[0] & /*currentDirs, current, currentDirs*/ 5) {
    				toggle_class(div, "hovered", /*current*/ ctx[0] === /*dir*/ ctx[12]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(360:8) {#each currentDirs as dir}",
    		ctx
    	});

    	return block;
    }

    // (425:8) {#each navHistory as dir, i}
    function create_each_block_2(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*dir*/ ctx[12] + "";
    	let t2;
    	let t3;
    	let div1_class_value;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[29](/*dir*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(/*i*/ ctx[36]);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(div0, "class", "historyIndex svelte-568287");
    			add_location(div0, file$1, 425, 10, 12260);

    			attr_dev(div1, "class", div1_class_value = "dir i " + (/*navHistoryLocation*/ ctx[5] === /*i*/ ctx[36]
    			? "special"
    			: "none") + " svelte-568287");

    			add_location(div1, file$1, 426, 10, 12307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			dispose = listen_dev(div1, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*navHistory*/ 8 && t2_value !== (t2_value = /*dir*/ ctx[12] + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*navHistoryLocation*/ 32 && div1_class_value !== (div1_class_value = "dir i " + (/*navHistoryLocation*/ ctx[5] === /*i*/ ctx[36]
    			? "special"
    			: "none") + " svelte-568287")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(425:8) {#each navHistory as dir, i}",
    		ctx
    	});

    	return block;
    }

    // (440:8) {#each favorites as dir, i}
    function create_each_block_1(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*dir*/ ctx[12] + "";
    	let t2;
    	let t3;
    	let div1_class_value;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[30](/*dir*/ ctx[12], ...args);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(/*i*/ ctx[36]);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(div0, "class", "historyIndex svelte-568287");
    			add_location(div0, file$1, 440, 10, 12711);

    			attr_dev(div1, "class", div1_class_value = "dir i " + (/*navHistoryLocation*/ ctx[5] === /*i*/ ctx[36]
    			? "special"
    			: "none") + " svelte-568287");

    			add_location(div1, file$1, 441, 10, 12758);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			dispose = listen_dev(div1, "click", click_handler_2, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*favorites*/ 16 && t2_value !== (t2_value = /*dir*/ ctx[12] + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*navHistoryLocation*/ 32 && div1_class_value !== (div1_class_value = "dir i " + (/*navHistoryLocation*/ ctx[5] === /*i*/ ctx[36]
    			? "special"
    			: "none") + " svelte-568287")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(440:8) {#each favorites as dir, i}",
    		ctx
    	});

    	return block;
    }

    // (455:10) {#each currentFiles as file}
    function create_each_block$1(ctx) {
    	let div;
    	let t_value = /*file*/ ctx[32] + "";
    	let t;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[31](/*file*/ ctx[32], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "file svelte-568287");
    			add_location(div, file$1, 455, 12, 13120);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", click_handler_3, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*currentFiles*/ 2 && t_value !== (t_value = /*file*/ ctx[32] + "")) set_data_dev(t, t_value);
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
    		source: "(455:10) {#each currentFiles as file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t0;
    	let div14;
    	let div2;
    	let div0;
    	let h20;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let div6;
    	let div4;
    	let h21;
    	let t7;
    	let div3;
    	let i;
    	let t8;
    	let div5;
    	let t9;
    	let div9;
    	let div7;
    	let h22;
    	let t11;
    	let div8;
    	let t12;
    	let div13;
    	let div11;
    	let h23;
    	let t14;
    	let div10;
    	let t15;
    	let div12;
    	let current;
    	let dispose;
    	const nav = new Navigation({ $$inline: true });
    	nav.$on("nav", /*receiveNavHistoryLocation*/ ctx[6]);
    	let each_value_3 = /*currentDirs*/ ctx[2];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*navHistory*/ ctx[3];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*favorites*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*currentFiles*/ ctx[1];
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
    			div14 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "DIRECTORIES";
    			t2 = text("\r\n        current = ");
    			t3 = text(/*current*/ ctx[0]);
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t5 = space();
    			div6 = element("div");
    			div4 = element("div");
    			h21 = element("h2");
    			h21.textContent = "History";
    			t7 = space();
    			div3 = element("div");
    			i = element("i");
    			t8 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t9 = space();
    			div9 = element("div");
    			div7 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Favorites";
    			t11 = space();
    			div8 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t12 = space();
    			div13 = element("div");
    			div11 = element("div");
    			h23 = element("h2");
    			h23.textContent = "FILES";
    			t14 = space();
    			div10 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			div12 = element("div");
    			add_location(h20, file$1, 354, 8, 9054);
    			attr_dev(div0, "class", "section-title flex-row svelte-568287");
    			add_location(div0, file$1, 353, 6, 9008);
    			attr_dev(div1, "class", "dirs-listing svelte-568287");
    			add_location(div1, file$1, 357, 6, 9125);
    			add_location(div2, file$1, 352, 4, 8995);
    			add_location(h21, file$1, 418, 8, 12032);
    			attr_dev(i, "id", "saveHistory");
    			attr_dev(i, "class", "svelte-568287");
    			add_location(i, file$1, 420, 10, 12121);
    			attr_dev(div3, "class", "icon-container svelte-568287");
    			add_location(div3, file$1, 419, 8, 12058);
    			attr_dev(div4, "class", "section-title flex-row svelte-568287");
    			add_location(div4, file$1, 417, 6, 11986);
    			attr_dev(div5, "class", "history-listing svelte-568287");
    			add_location(div5, file$1, 423, 6, 12181);
    			add_location(div6, file$1, 415, 4, 11971);
    			add_location(h22, file$1, 436, 8, 12593);
    			attr_dev(div7, "class", "section-title flex-row svelte-568287");
    			add_location(div7, file$1, 435, 6, 12547);
    			attr_dev(div8, "class", "history-listing svelte-568287");
    			add_location(div8, file$1, 438, 6, 12633);
    			add_location(div9, file$1, 434, 4, 12534);
    			add_location(h23, file$1, 452, 8, 13015);
    			attr_dev(div10, "class", "files-listing svelte-568287");
    			add_location(div10, file$1, 453, 8, 13039);
    			add_location(div11, file$1, 451, 6, 13000);
    			add_location(div12, file$1, 461, 6, 13264);
    			add_location(div13, file$1, 450, 4, 12987);
    			attr_dev(div14, "class", "file-system svelte-568287");
    			add_location(div14, file$1, 351, 2, 8964);
    			add_location(main, file$1, 349, 0, 8908);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, div14);
    			append_dev(div14, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div1, null);
    			}

    			append_dev(div14, t5);
    			append_dev(div14, div6);
    			append_dev(div6, div4);
    			append_dev(div4, h21);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, i);
    			append_dev(div6, t8);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div5, null);
    			}

    			append_dev(div14, t9);
    			append_dev(div14, div9);
    			append_dev(div9, div7);
    			append_dev(div7, h22);
    			append_dev(div9, t11);
    			append_dev(div9, div8);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div8, null);
    			}

    			append_dev(div14, t12);
    			append_dev(div14, div13);
    			append_dev(div13, div11);
    			append_dev(div11, h23);
    			append_dev(div11, t14);
    			append_dev(div11, div10);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div10, null);
    			}

    			append_dev(div13, t15);
    			append_dev(div13, div12);
    			current = true;

    			dispose = [
    				listen_dev(div1, "mouseout", /*mouseout_handler_2*/ ctx[28], false, false, false),
    				listen_dev(div3, "click", /*saveHistory*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*current*/ 1) set_data_dev(t3, /*current*/ ctx[0]);

    			if (dirty[0] & /*currentDirs, current, navigate, mouseoverIcons, mouseoutIcons*/ 3589) {
    				each_value_3 = /*currentDirs*/ ctx[2];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*navHistoryLocation, navigate, navHistory*/ 552) {
    				each_value_2 = /*navHistory*/ ctx[3];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*navHistoryLocation, navigate, favorites*/ 560) {
    				each_value_1 = /*favorites*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div8, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*fileInfo, currentFiles*/ 258) {
    				each_value = /*currentFiles*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div10, null);
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
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
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

    function log$1(type, msg) {
    	CustomLogging_2[`${type}`].log(msg);
    	console.log(msg);
    }

    function cropFileName(name) {
    	let split = name.split("\\");
    	let tail = split.pop();
    	return tail;
    }

    function addFavorite(e, dir) {
    	log$1("up", `addFavorite called on ${dir}, ${e.target}`);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const fs = require("fs");
    	const path = require("path");
    	let current = "";
    	let dir = "";
    	let hoverAddFavorite = "";
    	let currentFiles = [];
    	let currentDirs = [];
    	let navHistory = [];
    	let favorites = [];
    	let oldPath = "";

    	onMount(() => {
    		console.log("onMount fs.svelte");
    		addNavHistory();
    	});

    	function receiveNavHistoryLocation(e) {
    		console.log("function receiveNavHistoryLocation", e.detail.data);
    		console.log(e);
    		$$invalidate(5, navHistoryLocation = e.detail.data);
    	}

    	function addNavHistory() {
    		if (navHistory[navHistory.length - 1] === currentPath) {
    			return;
    		}

    		$$invalidate(3, navHistory = [...navHistory, currentPath]);
    		$$invalidate(5, navHistoryLocation = 1);
    		storeNavHistory.set(navHistory);
    	}

    	function saveHistory() {
    		log$1("data", `saveHistory called. typeof navHistory = ${typeof navHistory} isArray? ${Array.isArray(navHistory)}`);
    		let data1 = [], data2 = [];

    		navHistory.forEach(item => {
    			data1 = [...data1, item + "\n"];
    		});

    		navHistory.forEach(item => {
    			data2 = data2 + item + "\n";
    		});

    		try {
    			fs.writeFileSync(`${process.cwd()}/test.txt`, navHistory);
    			fs.writeFileSync(`${process.cwd()}/test1.txt`, data1);
    			fs.writeFileSync(`${process.cwd()}/test2.txt`, data2);

    			//file written successfully
    			log$1("data", `saveHistory success @ ${process.cwd()}`);
    		} catch(err) {
    			console.error(err);
    		}
    	}

    	function buildProject() {

    		navHistory.forEach(item => {
    			data2 = data2 + item + "\n";
    		});
    	}

    	function readDirectory() {
    		console.log("readDirectory() path ", currentPath);
    		oldPath = currentPath;
    		$$invalidate(1, currentFiles = []);
    		$$invalidate(2, currentDirs = []);

    		if (currentPath.split("\\").length === 1) {
    			$$invalidate(14, currentPath = currentPath + path.sep);
    		}

    		try {
    			console.log(`inside readDirectory(), try fs.readdirSync(${currentPath})
        .map`);

    			fs.readdirSync(currentPath).map(contents => {
    				return path.join(currentPath, contents);
    			}).filter(isFile);
    		} catch(err) {
    			console.log("node fs readdirSync error!!! Cannot access this folder", err);
    			$$invalidate(14, currentPath = oldPath);
    			storeCurrentPath.set(currentPath);
    		}
    	}

    	const isFile = fileName => {
    		try {
    			if (fs.lstatSync(fileName).isFile()) {
    				$$invalidate(1, currentFiles = [...currentFiles, cropFileName(fileName)]);
    			} else {
    				$$invalidate(2, currentDirs = [...currentDirs, cropFileName(fileName)]);
    			}
    		} catch(err) {
    			
    		} // console.log(`error from lstatsync: `, err);
    	};

    	function fileInfo(fileName) {
    		var stats = fs.statSync(currentPath + "\\" + fileName);
    		var mtime = stats.mtime;
    		log$1("data", `Date ${fileName} last modified:   ${mtime}`);
    	}

    	function navigate(e, dir, type) {
    		oldPath = currentPath;
    		log$1("up", `navigate clicked ${dir} at event`);
    		console.log(e);

    		if (e.target.classList.contains("addFavorite")) {
    			log$1("data", `addFavorite ${dir}!`);
    			$$invalidate(4, favorites = [...favorites, currentPath + "\\" + dir]);
    			return;
    		}

    		if (currentPath === "undefined") {
    			$$invalidate(14, currentPath = navHistory[navHistory.length - 1]);
    		} else {
    			if (type === "directoryItem") {
    				console.log(`currentPath type is type ${type}`, currentPath);

    				if (currentPath.split("\\")[1] === "") {
    					$$invalidate(14, currentPath = currentPath + dir);
    					storeCurrentPath.set(currentPath);
    				} else {
    					$$invalidate(14, currentPath = currentPath + "\\" + dir);
    					storeCurrentPath.set(currentPath);
    				}
    			} else {
    				$$invalidate(14, currentPath = dir);
    				console.log("currentPath ", currentPath);
    				storeCurrentPath.set(currentPath);
    			}

    			readDirectory();
    			addNavHistory();
    		}
    	}

    	function mouseoverIcons(e, dir) {
    		// log(
    		//   "forward",
    		//   `MOUSEOVER event for dir ${dir}: ${e.target.nodeName}  ${e.target.classList}`
    		// );
    		console.log(e);

    		$$invalidate(0, current = dir);
    	}

    	function mouseoutIcons(e, dir) {
    		console.log(e);

    		if (e.toElement.classList.length < 1) {
    			$$invalidate(0, current = "");
    		}

    		if (e.fromElement.nodeName === "I") {
    			// log(
    			//   "back",
    			//   `MOUSEOUT event for element nodeName "I":::   ${e.fromElement.classList}`
    			// );
    			return;
    		} else if (e.fromElement.classList.contains("dir")) {
    			// log("back", `MOUSEOUT event left dir:::   ${e.fromElement.classList}`);
    			return;
    		} else if (e.fromElement.classList.contains("dirs-listing")) {
    			// log(
    			//   "back",
    			//   `MOUSEOUT event left dirs-listing:::  ${e.fromElement.classList}`
    			// );
    			$$invalidate(0, current = "");

    			return;
    		} else {
    			// log(
    			//   "error",
    			//   `MOUSEOUT event left dirs-listing:::  ${e.fromElement.classList}`
    			// );
    			$$invalidate(0, current = "");
    		}
    	}

    	const mouseover_handler = (dir, e) => mouseoverIcons(e, dir);
    	const mouseout_handler = (dir, e) => mouseoutIcons(e);
    	const click_handler = (dir, e) => navigate(e, dir, "directoryItem");
    	const mouseover_handler_1 = (dir, e) => mouseoverIcons(e, dir);
    	const mouseout_handler_1 = (dir, e) => mouseoutIcons(e);
    	const mouseout_handler_2 = e => mouseoutIcons(e);
    	const click_handler_1 = (dir, e) => navigate(e, dir, "historyItem");
    	const click_handler_2 = (dir, e) => navigate(e, dir, "historyItem");
    	const click_handler_3 = file => fileInfo(file);

    	$$self.$capture_state = () => ({
    		Nav: Navigation,
    		onMount,
    		storeCurrentPath,
    		storeNavHistory,
    		generateColors,
    		fs,
    		path,
    		customStylesObjects: CustomLogging_2,
    		log: log$1,
    		current,
    		dir,
    		hoverAddFavorite,
    		currentFiles,
    		currentDirs,
    		navHistory,
    		favorites,
    		oldPath,
    		receiveNavHistoryLocation,
    		addNavHistory,
    		saveHistory,
    		buildProject,
    		readDirectory,
    		cropFileName,
    		isFile,
    		fileInfo,
    		navigate,
    		mouseoverIcons,
    		mouseoutIcons,
    		addFavorite,
    		require,
    		console,
    		navHistoryLocation,
    		currentPath,
    		process,
    		root,
    		window,
    		Array,
    		data2
    	});

    	$$self.$inject_state = $$props => {
    		if ("current" in $$props) $$invalidate(0, current = $$props.current);
    		if ("dir" in $$props) $$invalidate(12, dir = $$props.dir);
    		if ("hoverAddFavorite" in $$props) hoverAddFavorite = $$props.hoverAddFavorite;
    		if ("currentFiles" in $$props) $$invalidate(1, currentFiles = $$props.currentFiles);
    		if ("currentDirs" in $$props) $$invalidate(2, currentDirs = $$props.currentDirs);
    		if ("navHistory" in $$props) $$invalidate(3, navHistory = $$props.navHistory);
    		if ("favorites" in $$props) $$invalidate(4, favorites = $$props.favorites);
    		if ("oldPath" in $$props) oldPath = $$props.oldPath;
    		if ("navHistoryLocation" in $$props) $$invalidate(5, navHistoryLocation = $$props.navHistoryLocation);
    		if ("currentPath" in $$props) $$invalidate(14, currentPath = $$props.currentPath);
    		if ("root" in $$props) root = $$props.root;
    	};

    	let navHistoryLocation;
    	let currentPath;
    	let root;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*navHistory*/ 8) {
    			 $$invalidate(5, navHistoryLocation = navHistory.length - 1);
    		}

    		if ($$self.$$.dirty[0] & /*currentPath*/ 16384) {
    			 root = fs.readdirSync(currentPath);
    		}
    	};

    	 if (typeof window !== "undefined") {
    		storeCurrentPath.subscribe(data => {
    			$$invalidate(14, currentPath = data);
    			console.log("subscription path ", data);
    			readDirectory();
    		});

    		storeNavHistory.subscribe(history => {
    			// console.log("navHistory ", history);
    			$$invalidate(3, navHistory = history);
    		});
    	}

    	 $$invalidate(14, currentPath = process.cwd());

    	return [
    		current,
    		currentFiles,
    		currentDirs,
    		navHistory,
    		favorites,
    		navHistoryLocation,
    		receiveNavHistoryLocation,
    		saveHistory,
    		fileInfo,
    		navigate,
    		mouseoverIcons,
    		mouseoutIcons,
    		dir,
    		oldPath,
    		currentPath,
    		root,
    		fs,
    		path,
    		hoverAddFavorite,
    		addNavHistory,
    		buildProject,
    		readDirectory,
    		isFile,
    		mouseover_handler,
    		mouseout_handler,
    		click_handler,
    		mouseover_handler_1,
    		mouseout_handler_1,
    		mouseout_handler_2,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Fs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, [-1, -1]);

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
