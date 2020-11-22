<script>
  import { send, receive } from "./../utils/crossfade.js";
</script>

    <h2
      class="crossfade-item"
      in:receive={{ key: 'h2' }}
      out:send={{ key: 'h2' }}>
      Panel Three
    </h2>
    <img
      class="crossfade-item"
      in:receive={{ key: 'launch' }}
      out:send={{ key: 'launch' }}
      src="./../assets/008-launch-1.png"
      alt="" />