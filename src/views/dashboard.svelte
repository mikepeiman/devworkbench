<script>
  import { send, receive } from "./../utils/crossfade.js";
  import {
    storeCurrentPath,
    storeNavHistory,
    storeProjects
  } from "./../db/stores.js";
  let projects = JSON.parse(localStorage.getItem("projects")) || $storeProjects

  storeProjects.subscribe(val => {
    console.log(`storeProjects subscribe `, val)
  })
</script>

<style>
  .dashboard {
    background: rgba(0, 25, 55, 0.5);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .project {
    background: rgba(0, 25, 255, 0.5);
    margin: 1rem;
    padding: 1rem;
  }
</style>

<main>
  <h2
    class="crossfade-item"
    in:receive={{ key: 'h2' }}
    out:send={{ key: 'h2' }}>
    Dashboard
  </h2>
  <div class="dashboard">
    {#each projects as project, i}
      <div class="project">{project}</div>
    {/each}
  </div>
</main>
