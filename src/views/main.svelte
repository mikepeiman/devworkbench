<script>
  import FS from "./../filesystem/fs.svelte";
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
    <Tab>One</Tab>
    <Tab>Two</Tab>
    <Tab>Three</Tab>
  </TabList>

  <TabPanel>
    <main>
      <img
        class="crossfade-item"
        in:receive={{ key: 'launch' }}
        out:send={{ key: 'launch' }}
        src="./../assets/008-launch-1.png"
        alt="" />
      <h2
        class="crossfade-item"
        in:receive={{ key: 'h2' }}
        out:send={{ key: 'h2' }}>
        Panel One
      </h2>
    </main>
  </TabPanel>

  <TabPanel>
    <FS />
  </TabPanel>

  <TabPanel>
    <h2
      class="crossfade-item"
      in:receive={{ key: 'h2' }}
      out:send={{ key: 'h2' }}>
      Panel Three
    </h2>
    <img
      class="crossfade-item"
      in:receive={{ key: 'launch' }}
      out:send={{ key: 'launch' }}
      src="./../assets/008-launch-1.png"
      alt="" />
  </TabPanel>
</Tabs>
