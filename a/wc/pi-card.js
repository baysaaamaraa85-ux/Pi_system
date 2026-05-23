class PiCard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.title = this.getAttribute('title') || 'No Title';
        this.location = this.getAttribute('location') || 'Unknown';
        this.time = this.getAttribute('time') || 'N/A';
        this.phone = this.getAttribute('phone') || 'N/A';

        this.render();
    }

    disconnectedCallback() {
        // implementation
    }

    render() {
    this.innerHTML = `
    
    <article class="card">

        <div class="card-header">

            <div class="icon-box">
                <img src="../assets/svg/location.svg" class="icon">
            </div>

            <div class="card-info">
                <h3>${this.title}</h3>

                <p>
                    ${this.location}
                </p>
            </div>

        </div>

        <div class="row">

            <div class="info">
                <img src="../assets/svg/clock.svg" class="small-icon">
                <span>${this.time}</span>
            </div>

            <div class="info">
                <img src="../assets/svg/phone.svg" class="small-icon">
                <span>${this.phone}</span>
            </div>

        </div>

    </article>
    `;
}

    attributeChangedCallback(name, oldVal, newVal) {
        // implementation
    }

    adoptedCallback() {
        // implementation
    }
}

window.customElements.define('pi-card', PiCard);