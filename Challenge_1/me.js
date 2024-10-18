import { client } from "./client_config.js";

class Me {
    #numParticelsCarried;
    #particelsCarried;
    #map_particels;

    constructor() {
        this.id = null;
        this.name = null;
        this.x = null;
        this.y = null;
        this.score = null;
        this.#numParticelsCarried = 0;
        this.#particelsCarried = false;
        this.#map_particels = new Map();
    }

    get numParticelsCarried() {
        return this.#numParticelsCarried;
    }

    set numParticelsCarried(value) {
        this.#numParticelsCarried = value;
    }

    get particelsCarried() {
        return this.#particelsCarried;
    }

    set particelsCarried(value) {
        this.#particelsCarried = value;
    }

    get map_particels() {
        return this.#map_particels;
    }

    set map_particels(value) {
        this.#map_particels = value
    }

    setInfos({id, name, x, y, score}) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.score = score;
    }

}

export default Me;