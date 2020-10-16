<script>
  import { storeCurrentPath } from "./../db/stores.js";
  const fs = require("fs");

  const electron = require("electron");
  const BrowserWindow = electron.remote.BrowserWindow;
  const dialog = electron.remote.dialog;

  const cwd = process.cwd();
  console.log(`accessing assets: ${cwd}`);

  let navCrumbs = cwd.split("\\");
  let breadcrumbs = [];
  let lsCurrentPath;
  $: currentPath = "";
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
      filters: [
        // { name: "Images", extensions: ["jpg", "png", "gif"] },
        // { name: "Movies", extensions: ["mkv", "avi", "mp4"] },
        // { name: "Custom File Type", extensions: ["as"] },
        // { name: "All Files", extensions: ["*"] }
      ],
      // properties: ["openFile", "multiSelections"]
      properties: ["openDirectory"]
    };

    //Synchronous
    let filePaths = dialog.showOpenDialog(WIN, options);
    console.log(filePaths);
    filePaths.then(res => {
      $storeCurrentPath = res.filePaths;
      currentPath = res.filePaths;
      console.log("currentPath: ", currentPath);
    });
    // $storeCurrentPath = filePaths

    // dialog.showOpenDialog(WIN, options, dir => {
    //   console.log(dir);
    //   currentPath = dir
    // });
  }

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
      currentPath = lsCurrentPath;
      $storeCurrentPath = lsCurrentPath;
    } else {
      currentPath = cwd;
      $storeCurrentPath = cwd;
    }
    console.log("local currentPath: ", currentPath);
    console.log("global store currentPath: ", $storeCurrentPath);
    console.log("localStorage currentPath: ", lsCurrentPath);
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
  }

  .breadcrumb {
    background: #225599aa;
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
    background-image: url("../../assets/022-development-2.png");
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
    <div class="icon-container" on:click={e => navUp(e)}>
      <i id="upDirectory" />
    </div>
  </div>
  <div class="breadcrumbs">
    {#each navCrumbs as crumb}
      <span class="breadcrumb" on:click={e => navigate(e)}>{crumb}</span>
      <!-- <span class="divider">></span> -->
    {/each}
  </div>

</div>
<h1>{currentPath}</h1>
