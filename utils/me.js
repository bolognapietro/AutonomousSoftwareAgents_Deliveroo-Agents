import { client } from "./client_config.js";

class Me {
    #numParticelsCarried;
    #particelsCarried;
    #previus_position;
    #map_particles;

    constructor() {
        this.id = null;
        this.name = null;
        this.x = null;
        this.y = null;
        this.score = null;
        this.#numParticelsCarried = 0;
        this.#particelsCarried = false;
        this.#previus_position = null;
        this.#map_particles = new Map();
        this.master = process.argv[3] === 'master'; // true if the agent is the master
        this.friendId = null;
        this.stuckedFriend = false;
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

    get previus_position() {    
        return this.#previus_position;
    }

    set previus_position(value) {
        this.#previus_position = value;
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

    getParticle() {
        return this.#map_particles;
    }

    perceiveParticle(id, particle) {
        this.#map_particles.set(id, particle);
    }

    getParticleById(id) {
        return this.#map_particles.get(id);
    }

    setFriendId(id) {
        this.friendId = id;
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