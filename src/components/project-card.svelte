<script>
  export let project;
  import { send, receive } from "./../utils/crossfade.js";
    import { fade, fly, slide } from "svelte/transition/";
  import { storeProjects } from "./../db/stores.js";
  import isJsonString from "./../utils/isJSONstring.js";
  // import { onMount } from 'svelte'
    import { customStylesObjects } from "./../utils/CustomLogging.js";

  function log(type, msg) {
    customStylesObjects[`${type}`].log(msg);
    console.log(msg);
  }
  let projects;

  storeProjects.subscribe(val => {
    console.log(`project-card projects subscription ${typeof val}`, val);
    if (isJsonString(val)) {
      projects = JSON.parse(val);
    } else {
      projects = val;
    }
  });


// onMount(() => {

// })

  function remove(name) {
    console.log(`typeof projects ${typeof projects}`);
    // projects = projects.filter(project => project.name != name);
    for(let project of projects) {
      if(project.name === name){
        project.show = false
      }
    }
    storeProjects.set(projects);
  }

    function add(name) {
    console.log(`typeof projects ${typeof projects}`);
    // projects = projects.filter(project => project.name != name);
    for(let project of projects) {
      if(project.name === name){
        project.show = true
      }
    }
    storeProjects.set(projects);
  }
</script>

<style>
  .project-card {
    background: rgba(125, 225, 255, 1);
    border: 5px solid rgba(125, 25, 255, 0.25);
    margin: 1rem;
    padding: 1rem;
    /* transition: all 1s; */
  }

  .icons {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon {
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }

  .remove {
    background-image: url("../../assets/002-remove.png");
  }

    .add {
    background-image: url("../../assets/025-plus - Copy.png");
  }


  .settings {
    background-image: url("../../assets/010-settings.png");
  }

  .launch {
    background-image: url("../../assets/008-launch-1.png");
  }

  .terminal {
    background-image: url("../../assets/081-web-programming.png");
  }
</style>

<div
  class="project-card"
  in:receive={{ key: project.name }}
  out:send={{ key: project.name }}
  >
  <!-- transition:fly={{key: projet.name, x: 500, duration: 200}} -->
  <div class="icons">
    <i class="icon launch" />
    <i class="icon terminal" />
    <i class="icon settings" />
    {#if project.show}
    <i class="icon remove" on:click={() => remove(project.name)} />
    {:else}
    <i class="icon add" on:click={() => add(project.name)} />
    {/if}
  </div>
  <h2>{project.name}</h2>
</div>
