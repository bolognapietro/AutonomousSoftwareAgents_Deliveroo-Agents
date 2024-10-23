import { client } from "./client_config.js";

class Me {
    #numParticelsCarried;
    #particelsCarried;
    #map_particles;

    constructor() {
        this.id = null;
        this.name = null;
        this.x = null;
        this.y = null;
        this.score = null;
        this.#numParticelsCarried = 0;
        this.#particelsCarried = false;
        this.#map_particles = new Map();
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
        return this.#map_particles;
    }

    set map_particles(value) {
        this.#map_particles = value
    }

    get get_coordinates() {
        return {x: this.x, y: this.y};
    }

    perceiveParticle(id, particle) {
        this.#map_particles.set(id, particle);
    }

    getParticleById(id) {
        return this.#map_particles.get(id);
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