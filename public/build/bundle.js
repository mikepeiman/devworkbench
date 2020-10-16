
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

    let currentPath = writable({});

    const storeCurrentPath = {
      subscribe: currentPath.subscribe,
      set: val => {
        currentPath.set(val);
        localStorage.setItem("currentPath", JSON.stringify(val));
      }
    };

    /* src\filesystem\navigation.svelte generated by Svelte v3.19.1 */
    const file$1 = "src\\filesystem\\navigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (183:4) {#each navCrumbs as crumb}
    function create_each_block(ctx) {
    	let span;
    	let t0_value = /*crumb*/ ctx[16] + "";
    	let t0;
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "breadcrumb svelte-sh8obx");
    			add_location(span, file$1, 183, 6, 4665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			dispose = listen_dev(span, "click", /*click_handler_1*/ ctx[15], false, false, false);
    		},
    		p: noop,
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
    		source: "(183:4) {#each navCrumbs as crumb}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div5;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div3;
    	let div2;
    	let i1;
    	let t1;
    	let div4;
    	let t2;
    	let h1;
    	let t3;
    	let dispose;
    	let each_value = /*navCrumbs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			i1 = element("i");
    			t1 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			h1 = element("h1");
    			t3 = text(/*currentPath*/ ctx[0]);
    			attr_dev(i0, "id", "openDirectory");
    			attr_dev(i0, "class", "svelte-sh8obx");
    			add_location(i0, file$1, 173, 6, 4418);
    			attr_dev(div0, "class", "icon-container svelte-sh8obx");
    			add_location(div0, file$1, 172, 4, 4358);
    			attr_dev(div1, "class", "nav svelte-sh8obx");
    			add_location(div1, file$1, 171, 2, 4335);
    			attr_dev(i1, "id", "upDirectory");
    			attr_dev(i1, "class", "svelte-sh8obx");
    			add_location(i1, file$1, 178, 6, 4552);
    			attr_dev(div2, "class", "icon-container svelte-sh8obx");
    			add_location(div2, file$1, 177, 4, 4491);
    			attr_dev(div3, "class", "nav svelte-sh8obx");
    			add_location(div3, file$1, 176, 2, 4468);
    			attr_dev(div4, "class", "breadcrumbs svelte-sh8obx");
    			add_location(div4, file$1, 181, 2, 4600);
    			attr_dev(div5, "class", "nav-wrapper svelte-sh8obx");
    			add_location(div5, file$1, 170, 0, 4306);
    			add_location(h1, file$1, 189, 0, 4814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div5, t0);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, i1);
    			append_dev(div5, t1);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t3);

    			dispose = [
    				listen_dev(div0, "click", /*selectFolder*/ ctx[3], false, false, false),
    				listen_dev(div2, "click", /*click_handler*/ ctx[14], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navigate, navCrumbs*/ 18) {
    				each_value = /*navCrumbs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*currentPath*/ 1) set_data_dev(t3, /*currentPath*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h1);
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
    	const fs = require("fs");
    	const electron = require("electron");
    	const BrowserWindow = electron.remote.BrowserWindow;
    	const dialog = electron.remote.dialog;
    	const cwd = process.cwd();
    	console.log(`accessing assets: ${cwd}`);
    	let navCrumbs = cwd.split("\\");
    	let breadcrumbs = [];
    	let lsCurrentPath;
    	let test = "";

    	function navUp(e) {
    		console.log(`navUp clicked, `, cwd, `${e}`);
    		console.log(e);
    		let newDir = e.target;
    		console.log(navCrumbs);
    		test += "test ... ";
    		storeCurrentPath.set(test);
    	}

    	function selectFolder() {
    		//main.js - the main process
    		// const WIN = new BrowserWindow({ width: 800, height: 600 });
    		//renderer.js - a renderer process
    		const { remote } = require("electron"),
    			dialog = remote.dialog,
    			WIN = remote.getCurrentWindow();

    		let options = {
    			// See place holder 1 in above image
    			title: "Select Folder",
    			// See place holder 2 in above image
    			defaultPath: "C:\\Users\\Mike\\Desktop\\WEB DEV",
    			// See place holder 3 in above image
    			buttonLabel: "Select Folder",
    			// See place holder 4 in above image
    			filters: [], // { name: "Images", extensions: ["jpg", "png", "gif"] },
    			// { name: "Movies", extensions: ["mkv", "avi", "mp4"] },
    			// { name: "Custom File Type", extensions: ["as"] },
    			// { name: "All Files", extensions: ["*"] }
    			// properties: ["openFile", "multiSelections"]
    			properties: ["openDirectory"]
    		};

    		//Synchronous
    		let filePaths = dialog.showOpenDialog(WIN, options);

    		console.log(filePaths);

    		filePaths.then(res => {
    			set_store_value(storeCurrentPath, $storeCurrentPath = res.filePaths);
    			$$invalidate(0, currentPath = res.filePaths);
    			console.log("currentPath: ", currentPath);
    		});
    	} // $storeCurrentPath = filePaths
    	// dialog.showOpenDialog(WIN, options, dir => {

    	//   console.log(dir);
    	//   currentPath = dir
    	// });
    	function navigate(e) {
    		breadcrumbs = [];
    		console.log(e.target.textContent);

    		for (let i = 0; i < navCrumbs.length; i++) {
    			console.log("breadcrumbs current iteration: ", i);
    			console.log(breadcrumbs);
    			breadcrumbs = [...breadcrumbs, navCrumbs[i - 1] + navCrumbs[i]];
    		}

    		console.log(breadcrumbs);
    		lsCurrentPath = JSON.parse(localStorage.getItem("currentPath"));

    		if (lsCurrentPath) {
    			$$invalidate(0, currentPath = lsCurrentPath);
    			set_store_value(storeCurrentPath, $storeCurrentPath = lsCurrentPath);
    		} else {
    			$$invalidate(0, currentPath = cwd);
    			set_store_value(storeCurrentPath, $storeCurrentPath = cwd);
    		}

    		console.log("local currentPath: ", currentPath);
    		console.log("global store currentPath: ", $storeCurrentPath);
    		console.log("localStorage currentPath: ", lsCurrentPath);
    	}

    	const click_handler = e => navUp(e);
    	const click_handler_1 = e => navigate(e);

    	$$self.$capture_state = () => ({
    		storeCurrentPath,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		cwd,
    		navCrumbs,
    		breadcrumbs,
    		lsCurrentPath,
    		test,
    		navUp,
    		selectFolder,
    		navigate,
    		require,
    		process,
    		console,
    		currentPath,
    		$storeCurrentPath,
    		JSON,
    		localStorage
    	});

    	$$self.$inject_state = $$props => {
    		if ("navCrumbs" in $$props) $$invalidate(1, navCrumbs = $$props.navCrumbs);
    		if ("breadcrumbs" in $$props) breadcrumbs = $$props.breadcrumbs;
    		if ("lsCurrentPath" in $$props) lsCurrentPath = $$props.lsCurrentPath;
    		if ("test" in $$props) test = $$props.test;
    		if ("currentPath" in $$props) $$invalidate(0, currentPath = $$props.currentPath);
    	};

    	let currentPath;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(0, currentPath = "");

    	return [
    		currentPath,
    		navCrumbs,
    		navUp,
    		selectFolder,
    		navigate,
    		breadcrumbs,
    		lsCurrentPath,
    		test,
    		$storeCurrentPath,
    		fs,
    		electron,
    		BrowserWindow,
    		dialog,
    		cwd,
    		click_handler,
    		click_handler_1
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
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (104:4) {#each currentDirs as dir}
    function create_each_block_1(ctx) {
    	let div;
    	let t_value = /*dir*/ ctx[14] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[9](/*dir*/ ctx[14], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "dir svelte-jmica1");
    			add_location(div, file_1, 104, 6, 2440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentDirs*/ 2 && t_value !== (t_value = /*dir*/ ctx[14] + "")) set_data_dev(t, t_value);
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
    		source: "(104:4) {#each currentDirs as dir}",
    		ctx
    	});

    	return block;
    }

    // (110:4) {#each currentFiles as file}
    function create_each_block$1(ctx) {
    	let div;
    	let t_value = /*file*/ ctx[11] + "";
    	let t;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[10](/*file*/ ctx[11], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "file svelte-jmica1");
    			add_location(div, file_1, 110, 6, 2612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*currentFiles*/ 1 && t_value !== (t_value = /*file*/ ctx[11] + "")) set_data_dev(t, t_value);
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
    		source: "(110:4) {#each currentFiles as file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let t2;
    	let h20;
    	let t4;
    	let div0;
    	let t5;
    	let h21;
    	let t7;
    	let div1;
    	let current;
    	const nav = new Navigation({ $$inline: true });
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
    			h1 = element("h1");
    			h1.textContent = "FS component";
    			t1 = space();
    			create_component(nav.$$.fragment);
    			t2 = space();
    			h20 = element("h2");
    			h20.textContent = "DIRECTORIES";
    			t4 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			h21 = element("h2");
    			h21.textContent = "FILES";
    			t7 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file_1, 98, 2, 2279);
    			add_location(h20, file_1, 100, 2, 2315);
    			attr_dev(div0, "class", "dirs-listing svelte-jmica1");
    			add_location(div0, file_1, 101, 2, 2339);
    			add_location(h21, file_1, 107, 2, 2525);
    			attr_dev(div1, "class", "files-listing svelte-jmica1");
    			add_location(div1, file_1, 108, 2, 2543);
    			add_location(main, file_1, 97, 0, 2269);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(nav, main, null);
    			append_dev(main, t2);
    			append_dev(main, h20);
    			append_dev(main, t4);
    			append_dev(main, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(main, t5);
    			append_dev(main, h21);
    			append_dev(main, t7);
    			append_dev(main, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navDown, currentDirs*/ 6) {
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
    						each_blocks[i].m(div1, null);
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

    function fileInfo(e) {
    	console.log(`fileInfo on ${file}: `, file);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const fs = require("fs");
    	const path = require("path");
    	let currentFiles = [];
    	let currentDirs = [];

    	onMount(() => {
    		const dir1 = __dirname;
    		const cwd = process.cwd();
    		console.log("ROOT:", root);
    		console.log("__dirname: ", dir1);
    		console.log("cwd: ", cwd);
    		navigate();
    	});

    	function navigate() {
    		$$invalidate(0, currentFiles = []);
    		$$invalidate(1, currentDirs = []);

    		fs.readdirSync(folderPath).map(fileName => {
    			// console.log(`inside folderPath.map: `, fileName);
    			return path.join(folderPath, fileName);
    		}).filter(isFile);
    	}

    	const isFile = fileName => {
    		// console.log(fs.lstatSync(fileName));
    		if (fs.lstatSync(fileName).isFile()) {
    			$$invalidate(0, currentFiles = [...currentFiles, fileName]);
    		} else {
    			$$invalidate(1, currentDirs = [...currentDirs, fileName]); // console.log(`currentFiles: `, currentFiles);
    		} // console.log(`currentDirs: `, currentDirs);
    	};

    	function navDown(e) {
    		console.log(`navDown clicked here: ${e}`);
    		$$invalidate(3, folderPath = e);
    		let fullPath = `${folderPath}\\${e}`;
    		console.log(`fullpath: ${fullPath}`);
    		navigate();
    	}

    	const click_handler = dir => navDown(dir);
    	const click_handler_1 = file => fileInfo();

    	$$self.$capture_state = () => ({
    		Nav: Navigation,
    		onMount,
    		fs,
    		path,
    		currentFiles,
    		currentDirs,
    		navigate,
    		isFile,
    		fileInfo,
    		navDown,
    		require,
    		folderPath,
    		process,
    		root,
    		__dirname,
    		console,
    		file
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentFiles" in $$props) $$invalidate(0, currentFiles = $$props.currentFiles);
    		if ("currentDirs" in $$props) $$invalidate(1, currentDirs = $$props.currentDirs);
    		if ("folderPath" in $$props) $$invalidate(3, folderPath = $$props.folderPath);
    		if ("root" in $$props) root = $$props.root;
    	};

    	let folderPath;
    	let root;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*folderPath*/ 8) {
    			 root = fs.readdirSync(folderPath);
    		}
    	};

    	 $$invalidate(3, folderPath = process.cwd());

    	return [
    		currentFiles,
    		currentDirs,
    		navDown,
    		folderPath,
    		root,
    		fs,
    		path,
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
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let a;
    	let t6;
    	let t7;
    	let current;
    	const fs = new Fs({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			p = element("p");
    			t4 = text("Visit the\r\n    ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t6 = text("\r\n    to learn how to build Svelte apps.");
    			t7 = space();
    			create_component(fs.$$.fragment);
    			attr_dev(h1, "class", "svelte-19xyxbs");
    			add_location(h1, file$2, 28, 2, 467);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file$2, 31, 4, 517);
    			add_location(p, file$2, 29, 2, 493);
    			attr_dev(main, "class", "svelte-19xyxbs");
    			add_location(main, file$2, 27, 0, 457);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, t4);
    			append_dev(p, a);
    			append_dev(p, t6);
    			append_dev(main, t7);
    			mount_component(fs, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
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
