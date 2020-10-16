import { writable } from "svelte/store";

let currentPath = writable({})

export const storeCurrentPath = {
  subscribe: currentPath.subscribe,
  set: val => {
    currentPath.set(val);
    localStorage.setItem("currentPath", JSON.stringify(val))
  }
}