<script>
   const fs = require('fs')
  
   const root = fs.readdirSync('/')
  
  console.log(root)
</script>

<style>

.root-dir {
  display: flex;
  flex-wrap: wrap;
  text-align: left;
}
.dir {
  padding: 1rem;
  margin: .25rem;
  background: rgba(0,55,255,0.2);
  width: 20ch;
  display: flex;
}
.dir:hover {
    background: rgba(0,55,255,0.5);
}
</style>

<main>
	<h1>FS component</h1>
<div class="root-dir">
    {#each root as dir}
    <div class="dir">{ dir }</div>
    {/each}
</div>
</main>