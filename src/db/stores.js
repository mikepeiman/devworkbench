import { writable } from "svelte/store";

let currentPath = writable("C:\\Users\\Mike\\Desktop\\WEB DEV\\devworkbench")

export const storeCurrentPath = {
  subscribe: currentPath.subscribe,
  set: val => {
    currentPath.set(val);
    localStorage.setItem("currentPath", JSON.stringify(val))
  }
}