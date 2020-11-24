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
    for (let project of projects) {
      if (project.name === name) {
        project.show = false;
      }
    }
    storeProjects.set(projects);
  }

  function add(name) {
    console.log(`typeof projects ${typeof projects}`);
    // projects = projects.filter(project => project.name != name);
    for (let project of projects) {
      if (project.name === name) {
        project.show = true;
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
    display: grid;
    grid-template-columns: 2rem 1fr 2rem;
    grid-auto-rows: auto;
    height: auto;
  }

  .icons {
    display: flex;
    flex-direction: column;
  }

  .icon {
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 2rem;
    height: 2rem;
    top: 0;
    padding: 0;
    /* margin: -1rem 0; */
  }

  .group-left {
    background: rgb(52, 154, 185);
  }
  .group-right {
    /* background: rgb(217, 229, 233); */
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
    background-image: url("../../assets/078-start-up.png");
  }

  .terminal {
    background-image: url("../../assets/081-web-programming.png");
  }

  .hide {
    background: rgba(125, 225, 255, 0.2);
    border: 0;
    margin: 0.25rem;
    padding: 0.5rem;
    font-size: 1rem;
    font-weight: 300;
  }
</style>

<div
  class="project-card {project.show ? 'show' : 'hide'}"
  in:receive={{ key: project.name }}
  out:send={{ key: project.name }}>
  <!-- transition:fly={{key: projet.name, x: 500, duration: 200}} -->

  {#if project.show}
    <div class="icons group-left">
      <i class="icon launch" />
      <i class="icon terminal" />
    </div>
    <h2>{project.name}</h2>
    <div class="icons group-right">
      <i class="icon settings" />
      <i class="icon remove" on:click={() => remove(project.name)} />
    </div>
  {:else}
    <div class="icons group-left" />
    <h2>{project.name}</h2>
    <div class="icons group-right">
      <i class="icon add" on:click={() => add(project.name)} />
    </div>
  {/if}

</div>
