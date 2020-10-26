<script>
  import Nav from "./navigation.svelte";
  import { onMount } from "svelte";
  import { storeCurrentPath, storeNavHistory } from "./../db/stores.js";
  import generateColors from "./../utils/gradients.js";
  const fs = require("fs");
  const path = require("path");

  let currentFiles = [];
  let currentDirs = [];
  let navHistory = [];
  let navHistoryTracker = 1;
  $: currentPath = process.cwd();
  let oldPath = "";
  // $: currentPath = process.cwd();
  $: root = fs.readdirSync(currentPath);

  $: if (typeof window !== "undefined") {
    storeCurrentPath.subscribe(path => {
      currentPath = path;
      console.log("subscription path ", path);
      readDirectory();
    });
    storeNavHistory.subscribe(history => {
      // console.log("navHistory ", history);
      navHistory = history;
    });
  }

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
    currentFiles = [];
    currentDirs = [];
    if (currentPath.split("\\").length === 1) {
      currentPath = currentPath + path.sep;
    }
    try {
      console.log(`inside readDirectory(), try fs.readdirSync(${currentPath})
        .map`);
      fs.readdirSync(currentPath)
        .map(contents => {
          return path.join(currentPath, contents);
        })
        .filter(isFile);
    } catch (err) {
      console.log(
        "node fs readdirSync error!!! Cannot access this folder",
        err
      );
      currentPath = oldPath;
      storeCurrentPath.set(currentPath);
    }
  }

  function cropFileName(name) {
    let split = name.split("\\");
    let tail = split.pop();
    return tail;
  }

  const isFile = fileName => {
    try {
      if (fs.lstatSync(fileName).isFile()) {
        currentFiles = [...currentFiles, cropFileName(fileName)];
      } else {
        currentDirs = [...currentDirs, cropFileName(fileName)];
      }
    } catch (err) {
      // console.log(`error from lstatsync: `, err);
    }
  };

  function fileInfo(e) {
    console.log(`fileInfo on ${file}: `, file);
  }

  function navigate(dir, type) {
    oldPath = currentPath;
    console.log(`\n\nnavigate clicked here: ${dir}, currentPath: ${currentPath}\n\n`);
    if (currentPath === "undefined") {
      currentPath = navHistory[navHistory.length - 1];
    } else {
      if (type === "tail") {
        console.log(`currentPath type is type ${type}`, currentPath);
        if (currentPath.split("\\")[1] === "") {
          currentPath = currentPath + dir;
          storeCurrentPath.set(currentPath);
        } else {
          currentPath = currentPath + "\\" + dir;
          storeCurrentPath.set(currentPath);
        }
      } else {
        currentPath = dir;
        console.log("currentPath ", currentPath);
        storeCurrentPath.set(currentPath);
      }

      readDirectory();
      addNavHistory();
    }
  }
</script>

<style lang="scss">
  .files-listing {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 5px solid rgba(155, 55, 255, 0.7);
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    text-align: left;
  }
  .dirs-listing {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 5px solid rgba(0, 55, 255, 0.75);
    display: grid;
    grid-auto-flow: row;
    max-width: 100vw;
    grid-template-columns: repeat(5, auto);

    // flex-direction: row;
    // flex-wrap: wrap;
    // text-align: left;
  }
  .dir {
    padding: 0.5rem;
    margin: 0.25rem;
    // background: rgba(0, 55, 255, 0.2);
    color: rgba(40, 155, 255, 1);
    width: auto;
    border-bottom: 1px solid rgba(40, 155, 255, 1);
    border-right: 1px solid rgba(40, 155, 255, 1);
    box-shadow: 1px 1px 3px 0px rgba(40, 155, 255, 0.5);
    min-width: 12ch;
    display: flex;

    &:hover {
      color: rgba(140, 215, 255, 1);
      background: rgba(0, 55, 155, 0.75);
      cursor: pointer;
    }
  }
  .dot-dir {
    background: rgba(0, 55, 155, 0.25);
  }

  .file {
    padding: 0.5rem;
    margin: 0.25rem;
    background: rgba(155, 55, 255, 0.3);
    width: auto;
    min-width: 20ch;
    display: flex;
    &:hover {
      background: rgba(155, 55, 255, 0.5);
      cursor: pointer;
    }
  }

  .file-system {
    display: grid;
    grid-template-columns: 5fr 2fr;
  }

  .special {
    background: rgba(255, 100, 155, 0.2);
  }
</style>

<main>
  <Nav on:nav={receiveNavHistoryTracker} />
  <div class="file-system">
    <div>
      <h2>DIRECTORIES</h2>
      <div class="dirs-listing">
        {#each currentDirs as dir}
          <div
            class="dir {dir[0] == '.' ? 'dot-dir' : 'reg-dir'}"
            on:click={() => navigate(dir, 'tail')}>
            {dir}
          </div>
        {/each}
      </div>
    </div>
    <div>.</div>
    <div>
      <h2>FILES</h2>
      <div class="files-listing">
        {#each currentFiles as file}
          <div class="file" on:click={() => fileInfo(file)}>{file}</div>
        {/each}
      </div>
    </div>
  </div>
  <!-- <div>
      {#each navHistory as dir, i}
        <div
          class="dir i {navHistoryTracker === navHistory.length - i ? 'special' : 'none'}"
          on:click={() => navigate(dir, 'full')}>
          {dir}
        </div>
      {/each}
    </div>
  </div> -->
</main>
