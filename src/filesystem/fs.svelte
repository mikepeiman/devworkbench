<script>
  import Nav from "./navigation.svelte";
  import { onMount } from "svelte";
  import { storeCurrentPath, storeNavHistory } from "./../db/stores.js";
  import generateColors from "./../utils/gradients.js";
  const fs = require("fs");
  const path = require("path");
  import { customStylesObjects } from "./../utils/CustomLogging.js";

  function log(type, msg) {
    customStylesObjects[`${type}`].log(msg);
    console.log(msg);
  }
  let current = "";
  let dir = "";
  let hoverAddFavorite = "";
  let currentFiles = [];
  let currentDirs = [];
  let navHistory = [];
  $: navHistoryLocation = navHistory.length - 1;
  $: currentPath = process.cwd();
  let oldPath = "";
  $: root = fs.readdirSync(currentPath);

  $: if (typeof window !== "undefined") {
    storeCurrentPath.subscribe(data => {
      currentPath = data;
      console.log("subscription path ", data);
      readDirectory();
    });
    storeNavHistory.subscribe(history => {
      // console.log("navHistory ", history);
      navHistory = history;
    });
  }

  onMount(() => {
    console.log("onMount fs.svelte");
    addNavHistory();
  });

  function receiveNavHistoryLocation(e) {
    console.log("function receiveNavHistoryLocation", e.detail.data);
    console.log(e);
    navHistoryLocation = e.detail.data;
  }

  function addNavHistory() {
    if (navHistory[navHistory.length - 1] === currentPath) {
      return;
    }
    navHistory = [...navHistory, currentPath];
    navHistoryLocation = 1;
    storeNavHistory.set(navHistory);
  }

  function saveHistory() {
    log(
      "data",
      `saveHistory called. typeof navHistory = ${typeof navHistory} isArray? ${Array.isArray(
        navHistory
      )}`
    );
    let data1 = [],
      data2 = [];

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
      log("data", `saveHistory success @ ${process.cwd()}`);
    } catch (err) {
      console.error(err);
    }
  }

  function buildProject() {
    let project = {};
    navHistory.forEach(item => {
      data2 = data2 + item + "\n";
    });
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

  function fileInfo(fileName) {
    var stats = fs.statSync(currentPath + "\\" + fileName);
    var mtime = stats.mtime;
    log("data", `Date ${fileName} last modified:   ${mtime}`);
  }

  function navigate(dir, type) {
    oldPath = currentPath;
    console.log(
      `\n\nnavigate clicked here: ${dir}, currentPath: ${currentPath}\n\n`
    );
    if (currentPath === "undefined") {
      currentPath = navHistory[navHistory.length - 1];
    } else {
      if (type === "directoryItem") {
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
  function mouseoverIcons(e, dir) {
    log(
      "forward",
      `Hover event for dir ${dir}: ${e.target.nodeName}  ${e.target}`
    );
    console.log(e);
    current = dir;
  }

  function mouseoutIcons(e, dir) {
    log(
      "back",
      `Hover event for dir ${dir}: ${e.target.nodeName}  ${e.target}`
    );
    console.log(e);
    if (e.fromElement.nodeName === "I") {
      log("up", "We are just leaving the icon element");
      return
    } else if (e.target.classList.contains("dir")) {
      log("up", "We are just flashing the dir object")
    } else {
      current = "";
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
    // border-top: 5px solid rgba(0, 55, 255, 0.75);
    display: grid;
    grid-auto-flow: row;
    max-width: 100vw;
    grid-template-columns: repeat(5, auto);

    // flex-direction: row;
    // flex-wrap: wrap;
    // text-align: left;
  }
  .history-listing {
    margin-top: 1rem;
    padding-top: 1rem;
    display: grid;
    grid-template-columns: 2.5rem auto;
    // flex-direction: column;
    // flex-wrap: wrap;
    // text-align: left;
  }
  .section-title {
    border-bottom: 5px solid rgba(0, 55, 255, 0.75);
    padding-bottom: 1rem;
  }
  .dir {
    padding: 0.5rem;
    margin: 0.25rem;
    text-align: left;
    color: rgba(40, 155, 255, 1);
    width: 3rem;
    height: 3rem;
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
    grid-template-columns: 3fr 2fr 2fr;
  }

  .special {
    background: rgba(255, 100, 155, 0.2);
  }

  .historyIndex {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    // border: 2px solid black;
    color: rgba(255, 255, 255, 0.7);
    padding: 5px;
    width: 1.5rem;
    margin: 0.25rem;
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

  #saveHistory {
    background-image: url("../../assets/diskette.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }
  .flex-row {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hovered {
    width: 3rem;
    height: 3rem;
    position: relative;
    display: flex;
  }

  .addFavorite {
    background-image: url("../../assets/download.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
    position: absolute;
    right: 0;
    display: flex;
    z-index: 99;
    &:hover {
      background-image: url("../../assets/diskette.png");
    }
  }

  .hoverFavorite {
    background: black;
  }
</style>

<main>
  <Nav on:nav={receiveNavHistoryLocation} />
  <div class="file-system">
    <div>
      <div class="section-title flex-row">
        <h2>DIRECTORIES</h2>
      </div>
      <div class="dirs-listing">
        <!--  on:mouseout={e => mouseoutIcons(e, dir)} -->
        {#each currentDirs as dir}
          <div
            class="dir {dir[0] == '.' ? 'dot-dir' : 'reg-dir'}"
            class:hovered={current === dir}
            on:click={() => navigate(dir, 'directoryItem')}
            on:mouseover={e => mouseoverIcons(e, dir)}
            on:mouseout={e => mouseoutIcons(e, dir)}>
            {dir}
            {#if current === dir}
              <i
                class="addFavorite"
                on:mouseover={e => mouseoverIcons(e, dir)}
                on:mouseout={e => mouseoutIcons(e, dir)} />
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <div>

      <div class="section-title flex-row">
        <h2>History</h2>
        <div class="icon-container" on:click={saveHistory}>
          <i id="saveHistory" />
        </div>
      </div>
      <div class="history-listing">
        {#each navHistory as dir, i}
          <div class="historyIndex">{i}</div>
          <div
            class="dir i {navHistoryLocation === i ? 'special' : 'none'}"
            on:click={() => navigate(dir, 'historyItem')}>
            {dir}
          </div>
        {/each}
      </div>
    </div>
    <div>
      <div class="section-title flex-row">
        <h2>Favorites</h2>
      </div>
      <div class="history-listing">
        {#each navHistory as dir, i}
          <div class="historyIndex">{i}</div>
          <div
            class="dir i {navHistoryLocation === i ? 'special' : 'none'}"
            on:click={() => navigate(dir, 'historyItem')}>
            {dir}
          </div>
        {/each}
      </div>

    </div>
    <div>
      <div>
        <h2>FILES</h2>
        <div class="files-listing">
          {#each currentFiles as file}
            <div class="file" on:click={() => fileInfo(file)}>{file}</div>
          {/each}
        </div>
      </div>
      <!-- </div> -->

      <div />
    </div>
  </div>
</main>
