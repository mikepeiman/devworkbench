<script>
  import { send, receive } from "./../utils/crossfade.js";
  import ProjectCard from './../components/project-card.svelte'
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
      <!-- <div class="project">{project}</div> -->
      <ProjectCard location={project} />
    {/each}
  </div>
</main>
