<script>
  import { storeCurrentPath } from "./db/stores.js";
  import FS from "./filesystem/fs.svelte";
  import CustomLogging from "./utils/CustomLogging.js";

  // const custom = new CustomLogging();
  // const error = new CustomLogging("error");
  // error.setBodyStyle({ color: "red", size: "2rem" });

  // const special = new CustomLogging("special");
  // // special.setBodyStyle({ color: "rgba(0,70,255,0.5)", size: "1.2rem", padding: "2rem" });
  // special.setTitleStyle({ color: "rgba(0,70,255,0.5)", size: "1.2rem", margin: "0 0 0 1rem" });

  // console.log("Regular log..");
  // custom.log("Hello there!");
  // error.log("Something bad happened!");
  // special.log("I am very special")
</script>

<style>
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
  <FS />
</main>
