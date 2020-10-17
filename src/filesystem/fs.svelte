<script>
  import Nav from "./navigation.svelte";
  import { onMount } from "svelte";
  import { storeCurrentPath } from "./../db/stores.js";
  const fs = require("fs");
  const path = require("path");

  let currentFiles = [];
  let currentDirs = [];
  $: folderPath = process.cwd();
  // $: folderPath = process.cwd();
  $: root = fs.readdirSync(folderPath);
  onMount(() => {
    const dir1 = __dirname;
    const cwd = process.cwd();
    console.log("ROOT:", root);
    console.log("__dirname: ", dir1);
    console.log("cwd: ", cwd);

    storeCurrentPath.subscribe(path => {
      console.log("subscription path ", path);
      folderPath = path;
      navigate();
    });
  });

  function navigate() {
    console.log("navigate() path ", folderPath);
    console.log("navigate() path ", typeof folderPath);
    currentFiles = [];
    currentDirs = [];
    fs.readdirSync(folderPath)
      .map(fileName => {
        // console.log(`inside folderPath.map: `, fileName);
        return path.join(folderPath, fileName);
        // return fileName
      })
      .filter(isFile);
  }

  function cropFileName(name) {
    let split = name.split("\\");
    let tail = split.pop();
    console.log("the tail of the name split: ", tail);
    // if (tail[0] === ".") {
    //   if(tail == ".git") {
    //     return ".git"
    //   } else {
    //   return "...";
    // }
    return tail;
  }

  const isFile = fileName => {
    // console.log(fs.lstatSync(fileName));
    if (fs.lstatSync(fileName).isFile()) {
      currentFiles = [...currentFiles, cropFileName(fileName)];
      // console.log(`currentFiles: `, currentFiles);
    } else {
      currentDirs = [...currentDirs, cropFileName(fileName)];
      // console.log(`currentDirs: `, currentDirs);
    }
  };

  function fileInfo(e) {
    console.log(`fileInfo on ${file}: `, file);
  }

  function navDown(e) {
    console.log(`navDown clicked here: ${e}, folderPath: ${folderPath}`);
    folderPath = folderPath + "\\" + e;
    console.log("folderPath ", folderPath);
    storeCurrentPath.set(folderPath);
    navigate();
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
</style>

<main>
  <Nav />
  <div class="file-system">
    <div>
      <h2>DIRECTORIES</h2>
      <div class="dirs-listing">
        <!-- {#await currentDirs} -->
        {#each currentDirs as dir}
          <div
            class="dir {dir[0] == '.' ? 'dot-dir' : 'reg-dir'}"
            on:click={() => navDown(dir)}>
            {dir}
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h2>FILES</h2>
      <div class="files-listing">
        {#each currentFiles as file}
          <div class="file" on:click={() => fileInfo(file)}>{file}</div>
        {/each}
      </div>
    </div>
  </div>
  <!-- {/await} -->
</main>
