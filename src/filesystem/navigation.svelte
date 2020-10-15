<script>
// export let newDir
  const cwd = process.cwd();
  console.log(`accessing assets: ${cwd}`);
  function navUp(e) {
    console.log(`navUp clicked, `, e.target);
    let newDir = e.target
  }
</script>

<style lang="scss">
  .nav {
    display: flex;
    align-items: center;
    justify-content: center;
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
    padding: .5rem 1rem;
    background: #225599aa;
    &:hover {
      background: #22c5ffaa;
      color: #225599;
    }
    display: flex;
    align-items: center;
    border-radius: 5px;
  }

  p {
    font-size: 1.5rem;
    margin: .5rem .25rem;
  padding: 0 .25rem;
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

<div class="nav">
  <div class="icon-container" on:click={() => navUp}>
    <i id="navUp" />
    <p>UP</p>
  </div>

</div>
