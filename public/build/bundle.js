
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

    /* src\filesystem\navigation.svelte generated by Svelte v3.19.1 */
    const file$1 = "src\\filesystem\\navigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (271:4) {#each navCrumbs as crumb}
    function create_each_block(ctx) {
    	let span;
    	let t0_value = /*crumb*/ ctx[22] + "";
    	let t0;
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "breadcrumb svelte-6jomup");
    			add_location(span, file$1, 271, 6, 7284);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			dispose = listen_dev(span, "click", /*click_handler_3*/ ctx[21], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navCrumbs*/ 1 && t0_value !== (t0_value = /*crumb*/ ctx[22] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(271:4) {#each navCrumbs as crumb}",
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
    	let each_value = /*navCrumbs*/ ctx[0];
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
    			attr_dev(i0, "class", "svelte-6jomup");
    			add_location(i0, file$1, 251, 6, 6740);
    			attr_dev(div0, "class", "icon-container svelte-6jomup");
    			add_location(div0, file$1, 250, 4, 6680);
    			attr_dev(div1, "class", "nav svelte-6jomup");
    			add_location(div1, file$1, 249, 2, 6657);
    			attr_dev(i1, "id", "upDirectory");
    			attr_dev(i1, "class", "svelte-6jomup");
    			add_location(i1, file$1, 256, 6, 6881);
    			attr_dev(div2, "class", "icon-container svelte-6jomup");
    			add_location(div2, file$1, 255, 4, 6813);
    			attr_dev(div3, "class", "nav svelte-6jomup");
    			add_location(div3, file$1, 254, 2, 6790);
    			attr_dev(i2, "id", "backNavigate");
    			attr_dev(i2, "class", "svelte-6jomup");
    			add_location(i2, file$1, 261, 6, 7022);
    			attr_dev(div4, "class", "icon-container svelte-6jomup");
    			add_location(div4, file$1, 260, 4, 6952);
    			attr_dev(div5, "class", "nav svelte-6jomup");
    			add_location(div5, file$1, 259, 2, 6929);
    			attr_dev(i3, "id", "forwardNavigate");
    			attr_dev(i3, "class", "svelte-6jomup");
    			add_location(i3, file$1, 266, 6, 7167);
    			attr_dev(div6, "class", "icon-container svelte-6jomup");
    			add_location(div6, file$1, 265, 4, 7094);
    			attr_dev(div7, "class", "nav svelte-6jomup");
    			add_location(div7, file$1, 264, 2, 7071);
    			attr_dev(div8, "class", "breadcrumbs svelte-6jomup");
    			add_location(div8, file$1, 269, 2, 7219);
    			attr_dev(div9, "class", "nav-wrapper svelte-6jomup");
    			add_location(div9, file$1, 248, 0, 6628);
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
    				listen_dev(div4, "click", /*click_handler_1*/ ctx[19], false, false, false),
    				listen_dev(div6, "click", /*click_handler_2*/ ctx[20], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navigate, navCrumbs*/ 5) {
    				each_value = /*navCrumbs*/ ctx[0];
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

    	onMount(() => {
    		
    	});

    	function dispatchNavHistoryTracker() {
    		console.log("function dispatchNavHistoryTracker ", navHistoryTracker);
    		dispatch("nav", { data: navHistoryTracker });
    	}

    	function addNavHistory() {
    		$$invalidate(3, navHistory = [...navHistory, currentPath]);
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
    			$$invalidate(7, currentPath = res.filePaths[0]);
    			console.log("currentPath: ", currentPath);
    		});
    	}

    	function navigate(e) {
    		if (e === "back") {
    			console.log("\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< back\n");

    			if (navHistoryLength < 1) {
    				console.log("no history, exit");
    				return;
    			}

    			// addNavHistory()
    			$$invalidate(4, navHistoryTracker = navHistoryTracker + 1);

    			if (!navHistory[navHistoryIndex]) {
    				console.log("!no more history!");
    				$$invalidate(4, navHistoryTracker = navHistoryTracker - 1);
    				$$invalidate(6, navHistoryIndex = navHistoryLength - navHistoryTracker);
    				return;
    			}

    			dispatchNavHistoryTracker();
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryIndex]);
    			$$invalidate(7, currentPath = navHistory[navHistoryIndex]);
    			return;
    		}

    		if (e === "forward") {
    			console.log("\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> forward\n");

    			if (navHistoryLength < 1) {
    				console.log("no history, exit");
    				return;
    			}

    			$$invalidate(4, navHistoryTracker = navHistoryTracker - 1);
    			$$invalidate(6, navHistoryIndex = navHistoryLength - navHistoryTracker);

    			if (!navHistory[navHistoryIndex]) {
    				console.log("!no more history!");
    				$$invalidate(4, navHistoryTracker = navHistoryTracker + 1);
    				$$invalidate(6, navHistoryIndex = navHistoryLength - navHistoryTracker);
    				return;
    			}

    			console.log(`navHistoryTracker: ${navHistoryTracker}`);
    			console.log(`navHistoryIndex: ${navHistoryIndex}`);
    			console.log(`navHistory[navHistoryIndex]: ${navHistory[navHistoryIndex]}`);
    			dispatchNavHistoryTracker();
    			set_store_value(storeCurrentPath, $storeCurrentPath = navHistory[navHistoryIndex]);
    			$$invalidate(7, currentPath = navHistory[navHistoryIndex]);
    			return;
    		}

    		if (e === "up") {
    			console.log("up");
    			navCrumbs.pop();
    			(($$invalidate(0, navCrumbs), $$invalidate(7, currentPath)), $$invalidate(8, $storeCurrentPath));
    			let newPath = navCrumbs.join("\\");
    			console.log("newpath ", newPath);
    			storeCurrentPath.set(newPath);
    			addNavHistory();
    			return;
    		}

    		let i = navCrumbs.indexOf(e.target.textContent);
    		let dif = navCrumbs.length - i;

    		if (dif > 1) {
    			for (let x = 1; x < dif; x++) {
    				navCrumbs.pop();
    			}
    		}

    		(($$invalidate(0, navCrumbs), $$invalidate(7, currentPath)), $$invalidate(8, $storeCurrentPath));
    		let newPath = navCrumbs.join("\\");
    		console.log("newpath ", newPath);
    		storeCurrentPath.set(newPath);
    		$$invalidate(7, currentPath = newPath);
    		addNavHistory();
    	}

    	const click_handler = () => navigate("up");
    	const click_handler_1 = () => navigate("back");
    	const click_handler_2 = () => navigate("forward");
    	const click_handler_3 = e => navigate(e);

    	$$self.$capture_state = () => ({
    		storeCurrentPath,
    		storeNavHistory,
    		onMount,
    		createEventDispatcher,
    		dispatch,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		breadcrumbs,
    		lsCurrentPath,
    		dispatchNavHistoryTracker,
    		addNavHistory,
    		selectFolder,
    		navigate,
    		require,
    		navHistory,
    		navHistoryTracker,
    		navHistoryLength,
    		navHistoryIndex,
    		console,
    		currentPath,
    		$storeCurrentPath,
    		window,
    		navCrumbs
    	});

    	$$self.$inject_state = $$props => {
    		if ("breadcrumbs" in $$props) breadcrumbs = $$props.breadcrumbs;
    		if ("lsCurrentPath" in $$props) lsCurrentPath = $$props.lsCurrentPath;
    		if ("navHistory" in $$props) $$invalidate(3, navHistory = $$props.navHistory);
    		if ("navHistoryTracker" in $$props) $$invalidate(4, navHistoryTracker = $$props.navHistoryTracker);
    		if ("navHistoryLength" in $$props) $$invalidate(5, navHistoryLength = $$props.navHistoryLength);
    		if ("navHistoryIndex" in $$props) $$invalidate(6, navHistoryIndex = $$props.navHistoryIndex);
    		if ("currentPath" in $$props) $$invalidate(7, currentPath = $$props.currentPath);
    		if ("navCrumbs" in $$props) $$invalidate(0, navCrumbs = $$props.navCrumbs);
    	};

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
    		if ($$self.$$.dirty & /*navHistory*/ 8) {
    			 $$invalidate(5, navHistoryLength = navHistory.length);
    		}

    		if ($$self.$$.dirty & /*navHistoryLength, navHistoryTracker*/ 48) {
    			 $$invalidate(6, navHistoryIndex = navHistoryLength - navHistoryTracker - 1);
    		}

    		if ($$self.$$.dirty & /*navHistoryLength, navHistoryTracker, navHistoryIndex*/ 112) {
    			 console.log(`reactive navHistory length: ${navHistoryLength}, navHistoryTracker: ${navHistoryTracker}, navHistoryIndex: ${navHistoryIndex}  `);
    		}

    		if ($$self.$$.dirty & /*$storeCurrentPath*/ 256) {
    			 $$invalidate(7, currentPath = $storeCurrentPath);
    		}

    		if ($$self.$$.dirty & /*currentPath*/ 128) {
    			 $$invalidate(0, navCrumbs = currentPath.split("\\"));
    		}
    	};

    	 $$invalidate(3, navHistory = []);
    	 $$invalidate(4, navHistoryTracker = 1);

    	// console.log(`accessing assets: ${currentPath}`);
    	 if (typeof window !== "undefined") {
    		storeCurrentPath.subscribe(path => {
    			console.log("subscription path ", path);
    			$$invalidate(7, currentPath = path);
    		}); // navigate();

    		storeNavHistory.subscribe(history => {
    			console.log("navHistory ", history);
    			$$invalidate(4, navHistoryTracker = 1);
    			$$invalidate(3, navHistory = history);
    		}); // navigate();
    	}

    	return [
    		navCrumbs,
    		selectFolder,
    		navigate,
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
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (161:8) {#each currentDirs as dir}
    function create_each_block_1(ctx) {
    	let div;
    	let t0_value = /*dir*/ ctx[15] + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[13](/*dir*/ ctx[15], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "dir " + (/*dir*/ ctx[15][0] == "." ? "dot-dir" : "reg-dir") + " svelte-1d4rth4");
    			add_location(div, file_1, 161, 10, 4179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			dispose = listen_dev(div, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentDirs*/ 1 && t0_value !== (t0_value = /*dir*/ ctx[15] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*currentDirs*/ 1 && div_class_value !== (div_class_value = "dir " + (/*dir*/ ctx[15][0] == "." ? "dot-dir" : "reg-dir") + " svelte-1d4rth4")) {
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
    		source: "(161:8) {#each currentDirs as dir}",
    		ctx
    	});

    	return block;
    }

    // (181:6) {#each navHistory as dir, i}
    function create_each_block$1(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5_value = /*navHistory*/ ctx[1].length + "";
    	let t5;
    	let t6;
    	let div;
    	let t7_value = /*dir*/ ctx[15] + "";
    	let t7;
    	let t8;
    	let div_class_value;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[14](/*dir*/ ctx[15], ...args);
    	}

    	const block = {
    		c: function create() {
    			t0 = text("i: ");
    			t1 = text(/*i*/ ctx[17]);
    			t2 = text("\r\n      navHistoryTracker: ");
    			t3 = text(/*navHistoryTracker*/ ctx[2]);
    			t4 = text("\r\n      navHistory.length: ");
    			t5 = text(t5_value);
    			t6 = space();
    			div = element("div");
    			t7 = text(t7_value);
    			t8 = space();

    			attr_dev(div, "class", div_class_value = "dir i " + (/*navHistoryTracker*/ ctx[2] === /*navHistory*/ ctx[1].length - /*i*/ ctx[17]
    			? "special"
    			: "none") + " svelte-1d4rth4");

    			add_location(div, file_1, 184, 8, 4795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t7);
    			append_dev(div, t8);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*navHistoryTracker*/ 4) set_data_dev(t3, /*navHistoryTracker*/ ctx[2]);
    			if (dirty & /*navHistory*/ 2 && t5_value !== (t5_value = /*navHistory*/ ctx[1].length + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*navHistory*/ 2 && t7_value !== (t7_value = /*dir*/ ctx[15] + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*navHistoryTracker, navHistory*/ 6 && div_class_value !== (div_class_value = "dir i " + (/*navHistoryTracker*/ ctx[2] === /*navHistory*/ ctx[1].length - /*i*/ ctx[17]
    			? "special"
    			: "none") + " svelte-1d4rth4")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(181:6) {#each navHistory as dir, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t0;
    	let div4;
    	let div1;
    	let h2;
    	let t2;
    	let div0;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let current;
    	const nav = new Navigation({ $$inline: true });
    	nav.$on("nav", /*receiveNavHistoryTracker*/ ctx[3]);
    	let each_value_1 = /*currentDirs*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*navHistory*/ ctx[1];
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
    			div4 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "DIRECTORIES";
    			t2 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			div2.textContent = ".";
    			t5 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file_1, 157, 6, 4038);
    			attr_dev(div0, "class", "dirs-listing svelte-1d4rth4");
    			add_location(div0, file_1, 158, 6, 4066);
    			add_location(div1, file_1, 156, 4, 4025);
    			add_location(div2, file_1, 169, 4, 4378);
    			add_location(div3, file_1, 179, 4, 4638);
    			attr_dev(div4, "class", "file-system svelte-1d4rth4");
    			add_location(div4, file_1, 155, 2, 3994);
    			add_location(main, file_1, 153, 0, 3939);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div4, t5);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentDirs, navDown*/ 17) {
    				each_value_1 = /*currentDirs*/ ctx[0];
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

    			if (dirty & /*navHistoryTracker, navHistory, navDown*/ 22) {
    				each_value = /*navHistory*/ ctx[1];
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

    	onMount(() => {
    		const dir1 = __dirname;
    		const cwd = process.cwd();
    		console.log("ROOT:", root);
    		console.log("__dirname: ", dir1);
    		console.log("cwd: ", cwd);
    		addNavHistory();
    	});

    	function receiveNavHistoryTracker(e) {
    		console.log("function receiveNavHistoryTracker", e.detail.data);
    		console.log(e);
    		$$invalidate(2, navHistoryTracker = e.detail.data);
    	}

    	function addNavHistory() {
    		$$invalidate(1, navHistory = [...navHistory, currentPath]);
    		$$invalidate(2, navHistoryTracker = 1);
    		storeNavHistory.set(navHistory);
    	}

    	function navigate() {
    		// console.log("navigate() path ", currentPath);
    		// console.log("navigate() path ", typeof currentPath);
    		currentFiles = [];

    		$$invalidate(0, currentDirs = []);

    		fs.readdirSync(currentPath).map(fileName => {
    			// console.log(`inside currentPath.map: `, fileName);
    			return path.join(currentPath, fileName);
    		}).filter(isFile); // return fileName
    	}

    	const isFile = fileName => {
    		// console.log(fs.lstatSync(fileName));
    		if (fs.lstatSync(fileName).isFile()) {
    			currentFiles = [...currentFiles, cropFileName(fileName)];
    		} else {
    			$$invalidate(0, currentDirs = [...currentDirs, cropFileName(fileName)]); // console.log(`currentFiles: `, currentFiles);
    		} // console.log(`currentDirs: `, currentDirs);
    	};

    	function navDown(e) {
    		console.log(`navDown clicked here: ${e}, currentPath: ${currentPath}`);

    		if (currentPath === "undefined") {
    			$$invalidate(6, currentPath = navHistory[navHistory.length - 1]);
    		} else {
    			$$invalidate(6, currentPath = currentPath + "\\" + e);
    			console.log("currentPath ", currentPath);
    			storeCurrentPath.set(currentPath);
    			navigate();
    			addNavHistory();
    		}
    	}

    	const click_handler = dir => navDown(dir);
    	const click_handler_1 = dir => navDown(dir);

    	$$self.$capture_state = () => ({
    		Nav: Navigation,
    		onMount,
    		storeCurrentPath,
    		storeNavHistory,
    		fs,
    		path,
    		currentFiles,
    		currentDirs,
    		navHistory,
    		navHistoryTracker,
    		receiveNavHistoryTracker,
    		addNavHistory,
    		navigate,
    		cropFileName,
    		isFile,
    		fileInfo,
    		navDown,
    		require,
    		currentPath,
    		process,
    		root,
    		window,
    		console,
    		__dirname,
    		file
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentFiles" in $$props) currentFiles = $$props.currentFiles;
    		if ("currentDirs" in $$props) $$invalidate(0, currentDirs = $$props.currentDirs);
    		if ("navHistory" in $$props) $$invalidate(1, navHistory = $$props.navHistory);
    		if ("navHistoryTracker" in $$props) $$invalidate(2, navHistoryTracker = $$props.navHistoryTracker);
    		if ("currentPath" in $$props) $$invalidate(6, currentPath = $$props.currentPath);
    		if ("root" in $$props) root = $$props.root;
    	};

    	let currentPath;
    	let root;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentPath*/ 64) {
    			// $: currentPath = process.cwd();
    			 root = fs.readdirSync(currentPath);
    		}
    	};

    	 $$invalidate(6, currentPath = process.cwd());

    	 if (typeof window !== "undefined") {
    		storeCurrentPath.subscribe(path => {
    			console.log("subscription path ", path);
    			$$invalidate(6, currentPath = path);
    			navigate();
    		});

    		storeNavHistory.subscribe(history => {
    			console.log("navHistory ", history);
    			$$invalidate(1, navHistory = history);
    		}); // navigate();
    	}

    	return [
    		currentDirs,
    		navHistory,
    		navHistoryTracker,
    		receiveNavHistoryTracker,
    		navDown,
    		currentFiles,
    		currentPath,
    		root,
    		fs,
    		path,
    		addNavHistory,
    		navigate,
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
    			add_location(h1, file$2, 28, 2, 466);
    			attr_dev(main, "class", "svelte-19xyxbs");
    			add_location(main, file$2, 27, 0, 456);
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
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ storeCurrentPath, FS: Fs, name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
