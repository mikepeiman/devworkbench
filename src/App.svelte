<script>
  import { storeCurrentPath } from "./db/stores.js";
  import FS from "./filesystem/fs.svelte";
  import Main from "./views/main.svelte";
  import CustomLogging from "./utils/CustomLogging.js";

  // Importing this adds a right-click menu with 'Inspect Element' option
  const { remote } = require("electron");
  const { Menu, MenuItem } = remote;

  let rightClickPosition = null;

  const menu = new Menu();
  const menuItem = new MenuItem({
    label: "Inspect Element",
    click: () => {
      remote
        .getCurrentWindow()
        .inspectElement(rightClickPosition.x, rightClickPosition.y);
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

</script>

<style>
:global(body) {
      background: rgba(0, 25, 55, 0.95);
}
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;

  }
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  <h1>Dev Workbench</h1>
  <!-- <FS /> -->
  <Main />
</main>
