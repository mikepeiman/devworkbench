<script>
  import FS from "./../filesystem/fs.svelte";
  import Dashboard from "./dashboard.svelte";
  import Settings from "./settings.svelte";
  import { Tabs, Tab, TabList, TabPanel } from "svelte-tabs";
  import { flip } from "svelte/animate";
  import { send, receive } from "./../utils/crossfade.js";
  let selection = "";
</script>

<style>
  .crossfade-item {
    position: relative;
    display: inline-block;
  }
  :global(.svelte-tabs) {
    display: grid;
  }

  :global(.svelte-tabs div.svelte-tabs__tab-panel) {
    grid-row: 2;
    grid-column: 1;
  }
</style>

<h1>Main</h1>
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
