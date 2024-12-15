class Model {
    constructor(path, texture) {
        let xhr = new XMLHttpRequest();
        xhr.open("get", path, true);
        xhr.send(null);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                const lines = xhr.response.split('\n');
                console.log(lines.length);
            }
        }
    }
}
