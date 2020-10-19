
  const generateColors = (navCrumbs) => {
    let navCrumbObjects = []
    let hueOffset = 222;
    // let hueInterval = 3; * navCrumbs.length;
    let hueInterval = 6;
    let brightnessInterval = 30 / navCrumbs.length;
    // console.log("generateColors");
    for (let i = 0; i < navCrumbs.length; i++) {
      // console.log("navCrumbObjects: ", navCrumbObjects);
      navCrumbObjects = [
        ...navCrumbObjects,
        {
          name: navCrumbs[i],
          color: `--breadcrumb-color: hsla(${hueOffset}, 40%, ${60 + (brightnessInterval * i)}%, 1)`
        }
      ];
    }
    return navCrumbObjects
  }

export default generateColors