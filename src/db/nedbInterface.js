var Datastore = require("nedb");
export const projectsDB = new Datastore({ filename: "projects.db", autoload: true, timeStampData: true });

//  projectsDB