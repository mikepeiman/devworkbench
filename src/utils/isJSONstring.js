const isJsonString = (jsonString) => {
  // This function below ('printError') can be used to print details about the error, if any.
  // Please, refer to the original article (see the end of this post)
  // for more details. I suppressed details to keep the code clean.
  //
  let printError = function(error, explicit) {
    console.log(
      `[${explicit ? "EXPLICIT" : "INEXPLICIT"}] ${error.name}: ${
        error.message
      }`
    );
  };

  try {
    JSON.parse(jsonString);
    return true; // It's a valid JSON format
  } catch (e) {
    return false; // It's not a valid JSON format
  }
}

export default isJsonString