<script>
  const fs = require("fs");
  const cwd = process.cwd();
  console.log(`accessing assets: ${cwd}`);

  let breadcrumbs = cwd.split("\\");

  function navUp(e) {
    console.log(`navUp clicked, `, cwd, `${e}`);
    console.log(e);
    let newDir = e.target;
    console.log(breadcrumbs);
  }

  function navigate(e) {
    console.log(e.target.textContent);
  }
</script>

<style lang="scss">

.nav-wrapper {
  display: flex;
}
  .nav {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .breadcrumbs {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1rem;
  }

  .breadcrumb {
    background: #225599aa;
    padding: 0.25rem 1rem;
    // margin: 0.25rem;
    height: 3rem;
    display: flex;
    align-items: center;
    // border-radius: 5px;
    &:after {
      content: "\\";
    }
    &:hover {
      background: #22c5ffaa;
      color: #225599;
      cursor: pointer;
    }
  }

  .divider {
    font-weight: 900;
    color: black;
    font-size: 1rem;
  }
  i {
    color: #22c5ff;
    font-size: 2rem;

    /* margin: 1rem; */
    /* padding: 0.25rem 1rem; */
    border-radius: 5px;
  }

  .icon-container {
    width: auto;
    height: auto;
    padding: 0.25rem 1rem;
    background: #225599aa;
    &:hover {
      background: #22c5ffaa;
      color: #225599;
    }
    display: flex;
    align-items: center;
    border-radius: 5px;
  }

  .up {
    font-size: 1rem;
    margin: 0.5rem 0.25rem;
    padding: 0 0.25rem;
  }

  #navUp {
    background-image: url("../../assets/folder.png");
    background-size: 75%;
    background-repeat: no-repeat;
    background-position: center;
    width: 3rem;
    height: 3rem;
  }
</style>

<div class="nav-wrapper">
  <div class="nav">
    <div class="icon-container" on:click={e => navUp(e)}>
      <i id="navUp" />
      <!-- <span class="up">UP</span> -->
    </div>
  </div>
  <div class="breadcrumbs">
    {#each breadcrumbs as crumb}
      <span class="breadcrumb" on:click={e => navigate(e)}>{crumb}</span>
      <!-- <span class="divider">></span> -->
    {/each}
  </div>

</div>
