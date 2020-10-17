import { writable } from "svelte/store";

let currentPath = writable("C:\\Users\\Mike\\Desktop\\WEB DEV\\devworkbench")
let navHistory = writable([])

export const storeCurrentPath = {
  subscribe: currentPath.subscribe,
  set: val => {
    currentPath.set(val);
    localStorage.setItem("currentPath", JSON.stringify(val))
  }
}

export const storeNavHistory = {
  subscribe: navHistory.subscribe,
  set: val => {
    navHistory.set(val);
    localStorage.setItem("navHistory", JSON.stringify(val))
  }
}