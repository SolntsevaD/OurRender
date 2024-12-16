let models = {
    cube: ["models/", "pepe"]
};

function loadModels() {
    for (const key in models) {
        if (Object.hasOwnProperty.call(models, key)) {
            const modelURL = models[key][0];
            const textureName = models[key][1];
            models[key] = new Model(modelURL, textureName);
        }
    }
}
