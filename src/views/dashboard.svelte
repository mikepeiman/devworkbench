<script>
  import { send, receive } from "./../utils/crossfade.js";
  import {
    storeCurrentPath,
    storeNavHistory,
    storeProjects
  } from "./../db/stores.js";

</script>

<main>
  <h2
    class="crossfade-item"
    in:receive={{ key: 'h2' }}
    out:send={{ key: 'h2' }}>
    Dashboard
  </h2>
  {#each $storeProjects as project, i}{project}{/each}
</main>
