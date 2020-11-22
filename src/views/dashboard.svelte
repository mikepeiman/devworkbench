<script>
  import { send, receive } from "./../utils/crossfade.js";
</script>

<main>
  <img
    class="crossfade-item"
    in:receive={{ key: 'launch' }}
    out:send={{ key: 'launch' }}
    src="./../assets/008-launch-1.png"
    alt="" />
  <h2
    class="crossfade-item"
    in:receive={{ key: 'h2' }}
    out:send={{ key: 'h2' }}>
    Panel One
  </h2>
</main>
