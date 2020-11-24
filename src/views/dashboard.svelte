<script>
  import { send, receive } from "./../utils/crossfade.js";
  import isJsonString from "./../utils/isJSONstring.js"
  import { fade, fly } from "svelte/transition/";
  import ProjectCard from "./../components/project-card.svelte";
  import { storeProjects } from "./../db/stores.js";
  let projects;
  storeProjects.subscribe(val => {
    console.log(`dashboard projects subscription, val `, val);
    if (val == "[]" || val == "undefined") {
      projects = [];
      return
    } 
    if(isJsonString(val)) {
      projects = JSON.parse(val)
    } else {
      projects = val
    }
  });

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
    Dashboard - projects.length {projects.length}
  </h2>

  <div class="dashboard" in:receive={{ key: 'projects' }} out:fade>

    {#each projects as project, i}
      <!-- <div class="project">{project}</div> -->
      <ProjectCard {project} {i} />
    {/each}
  </div>
</main>
