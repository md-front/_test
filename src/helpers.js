const VALID_NEW_DATE = new Date(new Date() - (NEW_IN_DAYS * 24 * 60 * 60 * 1000));

function setLS(key, payload) {
    localStorage.setItem(key, JSON.stringify(payload))
}
function getLS(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

class Action {
    constructor({ name, img_url, btn_text }) {
        this.name = name;
        this.items = getLS(name);

        this.createClearBtn(img_url, btn_text);
    }

    createClearBtn(img_url, btn_text) {
        this.btn = document.createElement('button');
        this.btn.setAttribute('tyoe','button');
        this.btn.className = 'clear';
        this.btn.innerHTML = `Очистить ${btn_text} <img src="${img_url}">`;

        this.toggleBtnState();

        this.btn.addEventListener('click', () => this.clearItems());

        document.querySelector('header').appendChild(this.btn);
    }

    toggleBtnState() {
        if(!this.getItems().length)
            this.btn.classList.add('disabled')
        else
            this.btn.classList.remove('disabled')
    }

    clearItems() {
        this.setItems([]);

        const activeClass = `link__text--${this.name}`;
        const activeLinks = document.querySelectorAll(`.${activeClass}`);
        activeLinks.forEach(link => link.classList.remove(activeClass));
    }

    getItems() {
        return [...this.items];
    }

    setItems(payload = this.items) {
        this.items = payload;

        this.toggleBtnState();

        setLS(this.name, this.items);
    }

    isContain(id) {
        return this.items.includes(id);
    }

    addItem(id) {
        const result = this.getItems();
        result.push(id);
        this.setItems(result);
    }

    removeItem(id) {
        const result = this.getItems().filter(itemId => itemId !== id);
        // console.log('removeItem', id);
        this.setItems(result);
    }
}