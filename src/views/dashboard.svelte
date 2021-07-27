<script>
  import { send, receive } from "./../utils/crossfade.js";
  import isJsonString from "./../utils/isJSONstring.js";
  import { fade, fly } from "svelte/transition/";
  import ProjectCard from "./../components/project-card.svelte";
  import { storeProjects } from "./../db/stores.js";
  let projects;
  storeProjects.subscribe(val => {
    // console.log(`dashboard projects subscription, val `, val);
    if (val == "[]" || val == "undefined") {
      projects = [];
      return;
    }
    if (isJsonString(val)) {
      projects = JSON.parse(val);
    } else {
      projects = val;
    }
  });
</script>

<style>
@font-face {
    font-family: "Nunito";
    src: url("C:/webdev/FONTS/Nunito/Nunito-Light.ttf");
}
  .dashboard {
    /* background: rgba(0, 25, 55, 0.95); */
    display: grid;
    /* grid-template-columns: repeat(3, 1fr); */
    grid-template-columns: repeat(auto-fill, minmax(min(25rem, 100%), 1fr));
    grid-auto-rows: minmax(13vh, 20vh);
    transition: all 0.25s;
  }

  h2 {
    color: rgba(125, 225, 255, 0.75);
    font-family: 'Nunito', 'sans-serif';
    font-size: 2rem;
  }

  .hidden {
    background: rgba(255, 25, 55, 0.5);
    height: 0;
    opacity: 0;
  }

  .hide {
    height: 0;
  }
</style>

<main>
  <h2
    class="crossfade-item"
    in:receive={{ key: 'h2' }}
    out:send={{ key: 'h2' }}>
    PROJECTS
  </h2>

  <div
    class="dashboard"
    out:send={{ key: 'projects' }}
    in:receive={{ key: 'projects' }}>

    {#each projects.filter(p => p.show) as project (project.name)}
      <ProjectCard {project} />
    {/each}
  </div>
  <div
    class="dashboard hidden"
    out:send={{ key: 'projects' }}
    in:receive={{ key: 'projects' }}>

    {#each projects.filter(p => !p.show) as project (project.name)}
      <ProjectCard {project} />
    {/each}
  </div>
</main>
