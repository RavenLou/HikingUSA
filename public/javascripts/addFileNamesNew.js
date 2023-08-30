function previewMultiple(event) {
    const form = document.getElementById('formFile');
    form.innerHTML = "";
    const images = document.getElementById('images');
    for (i = 0; i < images.files.length; i++) {
        const url = URL.createObjectURL(event.target.files[i]);
        form.innerHTML += '<img src="' + url + '">';
    };
};