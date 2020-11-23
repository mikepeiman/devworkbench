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
    /* grid-template-columns: repeat(3, 1fr); */
    grid-template-columns: repeat(auto-fill, minmax(min(25rem, 100%), 1fr));
    grid-auto-rows: minmax(10vh, 20vh);
    
  }

  .project {
    background: rgba(125, 225, 255, 1);
    border: 5px solid rgba(125, 25, 255, 0.25);
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
