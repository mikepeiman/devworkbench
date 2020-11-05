<script>
  import { storeCurrentPath, storeNavHistory } from "./../db/stores.js";
  import generateColors from "./../utils/gradients.js";
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { customStylesObjects } from "./../utils/CustomLogging.js";

  function log(type, msg) {
    customStylesObjects[`${type}`].log(msg);
    console.log(msg);
  }

  const dispatch = createEventDispatcher();
  const fs = require("fs");
  const electron = require("electron");
  const BrowserWindow = electron.remote.BrowserWindow;
  const dialog = electron.remote.dialog;
  let breadcrumbs = [];
  let lsCurrentPath;

  $: navCrumbObjects = generateColors(navCrumbs);
  $: navHistory = [];
  $: navHistoryTracker = 1;
  $: navHistoryLength = navHistory.length;
  $: navHistoryIndex = navHistoryLength - navHistoryTracker - 1;
  $: console.log(
    `reactive navHistory length: ${navHistoryLength}, navHistoryTracker: ${navHistoryTracker}, navHistoryIndex: ${navHistoryIndex}  `
  );

  $: currentPath = $storeCurrentPath;
  // console.log(`accessing assets: ${currentPath}`);
  $: if (typeof window !== "undefined") {
    storeCurrentPath.subscribe(path => {
      currentPath = path;
      // currentPath = `${path}\\`;
      console.log("subscription path ", currentPath);
    });
    storeNavHistory.subscribe(history => {
      // log("data", "storeNavHistory called in navigation.svelte subscription");
      // navHistoryTracker = 1;
      navHistory = history;
      // navigate();
    });
  }
  $: navCrumbs = currentPath.split("\\");

  onMount(() => {
    navCrumbObjects = generateColors(navCrumbs);
  });

  function dispatchNavHistoryTracker() {
    console.log("function dispatchNavHistoryTracker ", navHistoryTracker);
    dispatch("nav", {
      data: navHistoryTracker
    });
  }

  function addNavHistory() {
    navHistoryTracker = navHistory.length - 1;
    navHistoryIndex = navHistoryLength - navHistoryTracker;
    navHistory = [...navHistory, { index: navHistoryIndex, path: currentPath }];
    storeNavHistory.set(navHistory);
  }

  function hoverButton(msg) {
    console.log(`hovering ${msg} button`);
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
      $storeCurrentPath = res.filePaths[0];
      currentPath = res.filePaths[0];
      console.log("currentPath: ", currentPath);
    });
  }

  function navigate(e) {
    console.log(`navigate called with e: ${e}`);
    if (e === "back") {
      if (navHistoryLength < 1) {
        console.log("no history, exit");
        return;
      }
      navHistoryTracker = navHistoryTracker + 1;
      log("back", `navHistoryLength: ${navHistoryLength}, navHistoryTracker: ${navHistoryTracker}`);
      if (!navHistory[navHistoryIndex]) {
        console.log("!no more history!");
        navHistoryTracker = navHistoryTracker - 1;
        navHistoryIndex = navHistoryLength - navHistoryTracker;
        return;
      }
      // dispatchNavHistoryTracker();
      $storeCurrentPath = navHistory[navHistoryIndex];
      currentPath = navHistory[navHistoryIndex];
      navCrumbObjects = generateColors(navCrumbs);
    }

    if (e === "forward") {
      if (navHistoryLength < 1) {
        console.log("no history, exit");
        return;
      }
      navHistoryTracker = navHistoryTracker - 1;
      log("forward", `navHistoryLength: ${navHistoryLength}, navHistoryTracker: ${navHistoryTracker}`);
      navHistoryIndex = navHistoryLength - navHistoryTracker;
      if (!navHistory[navHistoryIndex]) {
        console.log("!no more history!");
        navHistoryTracker = navHistoryTracker + 1;
        navHistoryIndex = navHistoryLength - navHistoryTracker;
        return;
      }
      console.log(`navHistoryTracker: ${navHistoryTracker}`);
      console.log(`navHistoryIndex: ${navHistoryIndex}`);
      console.log(
        `navHistory[navHistoryIndex]: ${navHistory[navHistoryIndex]}`
      );
      // dispatchNavHistoryTracker();
      $storeCurrentPath = navHistory[navHistoryIndex];
      currentPath = navHistory[navHistoryIndex];
      // addNavHistory();
      // return;
    }

    if (e === "up") {
      log("up", navCrumbs);
      navCrumbs.pop();
      navCrumbs = navCrumbs;
      navCrumbObjects = generateColors(navCrumbs);
      let newPath = navCrumbs.join("\\");
      console.log("~~~~~~~     newpath ", newPath);
      console.log("~~~~~~~     navcrumbs ", navCrumbs);
      // let pathJoin = navCrumbs.joi
      storeCurrentPath.set(newPath);
      // dispatchNavHistoryTracker();
      addNavHistory();
      // return;
    }
    if (typeof e === "object") {
      log("crumbs", currentPath);
      console.log(
        `navigate(e) clicked at currentPath ${currentPath}, e.target.textContent ${e.target.textContent}`
      );
      // using breadcrumbs navigation, going more than one level back/up
      let crumb = e.target.textContent.trim();
      let i = navCrumbs.indexOf(crumb);
      console.log(
        `e.target.textContent ${crumb}, index of this crumb: ${i} from navCrumbs ${navCrumbs}`
      );
      let dif = navCrumbs.length - i;

      if (dif > 1) {
        console.log(`crumbs dif is more than 1`);
        for (let x = 1; x < dif; x++) {
          navCrumbs.pop();
          console.log(`navCrumbs.pop()...ing`);
        }
      }
      navCrumbs = navCrumbs;
      let newPath = navCrumbs.join("\\");
      console.log("~~~~~~~     newpath ", newPath);
      console.log("~~~~~~~     navcrumbs ", navCrumbs);
      storeCurrentPath.set(newPath);
      currentPath = newPath;
      navCrumbObjects = generateColors(navCrumbs);
      // dispatchNavHistoryTracker();
      addNavHistory();
    }
    dispatchNavHistoryTracker();
  }
</script>

<style lang="scss">
  .nav-wrapper {
    display: flex;
  }
  .nav {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .breadcrumbs {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1rem;
    border-radius: 5px;
  }

  .breadcrumb {
    // background: #225599aa;
    background: var(--breadcrumb-color);
    padding: 0.25rem 1rem;
    // margin: 0.25rem;
    height: 3rem;
    display: flex;
    align-items: center;
    // border-radius: 5px;
    &:after {
      content: "\\";
    }
    &:hover {
      background: #22c5ffaa;
      color: #225599;
      cursor: pointer;
    }
    &:first-child {
      border-radius: 5px 0 0 5px;
    }
    &:last-child {
      border-radius: 0 5px 5px 0;
    }
  }

  .divider {
    font-weight: 900;
    color: black;
    font-size: 1rem;
  }
  i {
    color: #22c5ff;
    font-size: 2rem;

    /* margin: 1rem; */
    /* padding: 0.25rem 1rem; */
    border-radius: 5px;
  }

  .icon-container {
    width: auto;
    height: auto;
    padding: 0.25rem 1rem;
    margin: 0 0.5rem;
    background: #225599aa;
    &:hover {
      background: #22c5ffaa;
      color: #225599;
    }
    display: flex;
    align-items: center;
    border-radius: 5px;
  }

  .up {
    font-size: 1rem;
    margin: 0.5rem 0.25rem;
    padding: 0 0.25rem;
  }

  #upDirectory {
    background-image: url("../../assets/folder.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }
  #openDirectory {
    background-image: url("../../assets/061-folder-16.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }
  #backNavigate {
    background-image: url("../../assets/045-left-arrow.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }
  #forwardNavigate {
    background-image: url("../../assets/048-right-arrow.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }
</style>

<div class="nav-wrapper">
  <div class="nav">
    <div class="icon-container" on:click={selectFolder}>
      <i id="openDirectory" />
    </div>
  </div>
  <div class="nav">
    <div
      class="icon-container"
      on:click={() => navigate('up')}
      on:mouseover={() => hoverButton('up')}>
      <i id="upDirectory" />
    </div>
  </div>
  <div class="nav">
    <div
      class="icon-container"
      on:click={() => navigate('back')}
      on:mouseover={() => hoverButton('back')}>
      <i id="backNavigate" />
    </div>
  </div>
  <div class="nav">
    <div
      class="icon-container"
      on:click={() => navigate('forward')}
      on:mouseover={() => hoverButton('forward')}>
      <i id="forwardNavigate" />
    </div>
  </div>
  <!-- <div class="breadcrumbs">
    {#each navCrumbs as crumb}
      <span class="breadcrumb" on:click={e => navigate(e)}>{crumb}</span>
    {/each}
  </div> -->
  <div class="breadcrumbs">
    {#each navCrumbObjects as crumb, i}
      <span
        class="breadcrumb"
        on:click={e => navigate(e)}
        style={crumb.color}
        index={i}>
        {crumb.name}
      </span>
    {/each}
  </div>
</div>
