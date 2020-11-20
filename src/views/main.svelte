<script>
  import FS from "./../filesystem/fs.svelte";
  import { Tabs, Tab, TabList, TabPanel } from "svelte-tabs";
  let selection = "";
</script>

<h1>Main</h1>
<Tabs>
  <TabList>
    <Tab>One</Tab>
    <Tab>Two</Tab>
    <Tab>Three</Tab>
  </TabList>

  <TabPanel>
<img src="./../assets/008-launch-1.png" alt="">
  </TabPanel>

  <TabPanel>
    <FS />
  </TabPanel>

  <TabPanel>
    <h2>Panel Three</h2>
  </TabPanel>
</Tabs>
