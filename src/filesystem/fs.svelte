<script>
  import Nav from "./navigation.svelte";
  import { onMount } from "svelte";

  const fs = require("fs");
  const path = require("path");

  let currentFiles = [];
  let currentDirs = [];
  $: folderPath = process.cwd();
  $: root = fs.readdirSync(folderPath);
  onMount(() => {
    const dir1 = __dirname;
    const cwd = process.cwd();
    console.log("ROOT:", root);
    console.log("__dirname: ", dir1);
    console.log("cwd: ", cwd);

    navigate();
  });

  function navigate() {
    currentFiles = [];
    currentDirs = [];
    fs.readdirSync(folderPath)
      .map(fileName => {
        // console.log(`inside folderPath.map: `, fileName);
        return path.join(folderPath, fileName);
      })
      .filter(isFile);
  }

  const isFile = fileName => {
    // console.log(fs.lstatSync(fileName));
    if (fs.lstatSync(fileName).isFile()) {
      currentFiles = [...currentFiles, fileName];
      // console.log(`currentFiles: `, currentFiles);
    } else {
      currentDirs = [...currentDirs, fileName];
      // console.log(`currentDirs: `, currentDirs);
    }
  };

  function fileInfo(e) {
    console.log(`fileInfo on ${file}: `, file);
  }

  function navDown(e) {
    console.log(`navDown clicked here: ${e}`);
    folderPath = e;
    let fullPath = `${folderPath}\\${e}`;
    console.log(`fullpath: ${fullPath}`);
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
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    text-align: left;
  }
  .dir {
    padding: 1rem;
    margin: 0.25rem;
    background: rgba(0, 55, 255, 0.2);
    width: auto;
    min-width: 20ch;
    display: flex;
    &:hover {
      background: rgba(0, 55, 255, 0.5);
      cursor: pointer;
    }
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
</style>

<main>
  <h1>FS component</h1>
  <Nav />
  <h2>DIRECTORIES</h2>
  <div class="dirs-listing">
    <!-- {#await currentDirs} -->
    {#each currentDirs as dir}
      <div class="dir" on:click={() => navDown(dir)}>{dir}</div>
    {/each}
  </div>
  <h2>FILES</h2>
  <div class="files-listing">
    {#each currentFiles as file}
      <div class="file" on:click={() => fileInfo(file)}>{file}</div>
    {/each}
  </div>
  <!-- {/await} -->
</main>
