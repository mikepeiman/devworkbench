<script>
  import FS from "./../filesystem/fs.svelte";
  import Dashboard from "./dashboard.svelte";
  import Settings from "./settings.svelte";
  import { Tabs, Tab, TabList, TabPanel } from "svelte-tabs";
  import { flip } from "svelte/animate";
  import { send, receive } from "./../utils/crossfade.js";
  let selection = "";
</script>

<style lang="scss">
  @font-face {
    font-family: "Nunito";
    src: url("C:/Users/Mike/AppData/Roaming/Monotype/skyfonts-google/Nunito 200.ttf");
  }
  .crossfade-item {
    position: relative;
    display: inline-block;
  }
  :global(.svelte-tabs) {
    display: grid;
    // border-bottom: 2px solid rgba(125, 225, 255, 0.1);
  }
  :global(.svelte-tabs ul.svelte-tabs__tab-list) {
    border-bottom: 1px solid rgba(125, 225, 255, 0.1);
  }

  :global(.svelte-tabs li.svelte-tabs__tab) {
    color: rgba(125, 225, 255, 0.75);
    outline: none;
    font-family: "Nunito";
    padding: 0.75rem;
    transition: all 0.25s;
    &.svelte-tabs__selected {
      color: rgba(125, 225, 255, 1);
      outline: none;
      border-bottom: 2px solid rgba(125, 225, 255, 0.1);
      background: rgba(125, 225, 255, 0.1);
      transition: all 0.25s;
    }
  }
  :global(.svelte-tabs div.svelte-tabs__tab-panel) {
    grid-row: 2;
    grid-column: 1;
  }
</style>

<Tabs>
  <TabList>
    <Tab>Projects Dashboard</Tab>
    <Tab>Add Project</Tab>
    <Tab>Settings</Tab>
  </TabList>

  <TabPanel>
    <Dashboard />
  </TabPanel>

  <TabPanel>
    <FS />
  </TabPanel>

  <TabPanel>
    <Settings />
  </TabPanel>
</Tabs>
