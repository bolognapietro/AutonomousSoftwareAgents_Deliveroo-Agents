/**
 * Represents an agent with various properties and methods for managing particles and intentions.
 */
class Me {
    /**
     * @private
     * @type {boolean}
     */
    #particelsCarried;

    /**
     * @private
     * @type {Map}
     */
    #map_particles;

    /**
     * @private
     * @type {any}
     */
    #currentIntention;

    /**
     * @private
     * @type {boolean}
     */
    #notmoving;

    /**
     * Creates an instance of Me.
     */
    constructor() {
        this.id = null;
        this.name = null;
        this.x = null;
        this.y = null;
        this.score = null;
        this.master = process.argv[3] === 'master';
        this.friendId = null;
        this.#particelsCarried = false;
        this.#map_particles = new Map();
        this.#currentIntention = null;
        this.#notmoving = false;
    }

    /**
     * Gets whether particles are carried.
     * @returns {boolean}
     */
    get particelsCarried() {
        return this.#particelsCarried;
    }

    /**
     * Sets whether particles are carried.
     * @param {boolean} value
     */
    set particelsCarried(value) {
        this.#particelsCarried = value;
    }

    /**
     * Gets the map of particles.
     * @returns {Map}
     */
    get map_particels() {
        return this.#map_particles;
    }

    /**
     * Sets the map of particles.
     * @param {Map} value
     */
    set map_particles(value) {
        this.#map_particles = value;
    }

    /**
     * Gets the current intention of the agent.
     * @returns {any}
     */
    get currentIntention() {
        return this.#currentIntention;
    }

    /**
     * Sets the current intention of the agent.
     * @param {any} predicate
     */
    set currentIntention(predicate) {
        this.#currentIntention = predicate;
    }

    /**
     * Sets whether the agent is not moving.
     * @param {boolean} value
     */
    notmoving(value) {
        this.#notmoving = value;
    }

    /**
     * Gets whether the agent is not moving.
     * @returns {boolean}
     */
    notmoving() {
        return this.#notmoving;
    }

    /**
     * Sets the current intention of the agent.
     * @param {any} predicate
     */
    setCurrentIntention(predicate) {
        this.#currentIntention = predicate;
    }

    /**
     * Gets the current intention of the agent.
     * @returns {any}
     */
    getCurrentIntention() {
        return this.#currentIntention;
    }

    /**
     * Gets the map of particles.
     * @returns {Map}
     */
    getParticle() {
        return this.#map_particles;
    }

    /**
     * Adds a particle to the map of particles.
     * @param {string} id
     * @param {any} particle
     */
    perceiveParticle(id, particle) {
        this.#map_particles.set(id, particle);
    }

    /**
     * Gets a particle by its ID.
     * @param {string} id
     * @returns {any}
     */
    getParticleById(id) {
        return this.#map_particles.get(id);
    }

    /**
     * Sets the friend ID of the agent.
     * @param {string} id
     */
    setFriendId(id) {
        this.friendId = id;
    }

    /**
     * Sets the information of the agent.
     * @param {{id: string, name: string, x: number, y: number, score: number}} param0
     */
    setInfos({id, name, x, y, score}) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.score = score;
    }
}

export default Me;