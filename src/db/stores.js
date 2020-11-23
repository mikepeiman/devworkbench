import { writable } from "svelte/store";

let currentPath = writable("C:\\Users\\Mike\\Desktop\\WEB DEV\\devworkbench")
let navHistory = writable([])
let projects = writable(localStorage.getItem("projects") || [])

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


export const storeProjects = {
  subscribe: projects.subscribe,
  set: val => {
    console.log(`storeProjects in stores, val to set: `, val)
    if(val === "undefined") {
      console.log("storeProjects undefined")
    }
    projects.set(val);
    localStorage.setItem("projects", JSON.stringify(val))
  }
}