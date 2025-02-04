import Intention from "../intention/intention.js";

/**
 * Class representing a collection of plans.
 */
class Plans {
    /**
     * Private field to track whether the plan has been stopped.
     * @type {boolean}
     * @private
     */
    #stopped = false;

    /**
     * Stops the plan and all its sub-intentions.
     */
    stop() {
        // this.log('stop plan'); 
        this.#stopped = true; // set the stopped status to true.
        // Iterate over all sub-intentions.
        for (const i of this.#sub_intentions) { 
            i.stop(); // stop each sub-intention.
        }
    }

    /**
     * Getter method for the stopped status.
     * @returns {boolean} The stopped status.
     */
    get stopped() {
        return this.#stopped; 
    }

    /**
     * Private field to hold a reference to the parent object that might be controlling or monitoring this plan.
     * @type {Object}
     * @private
     */
    #parent;

    /**
     * Initializes the plan with a reference to the parent object.
     * @param {Object} parent - The parent object.
     */
    constructor( parent ) {
        this.#parent = parent;
    }

    /**
     * Logs messages using the parent's log method if available, otherwise defaults to console.log.
     * @param {...any} args - The messages or objects to log.
     */
    log(...args) {
        // Use the parent's log method if available.
        if (this.#parent && this.#parent.log) {
            this.#parent.log('\t', ...args); 
        } else {
            console.log(...args); // default to console.log if no parent log method is available.
        }
    }

    /**
     * Private field to store an array of sub-intentions.
     * @type {Array}
     * @private
     */
    #sub_intentions = [];

    /**
     * Creates a new sub-intention and attempts to achieve it.
     * @param {Function} predicate - The predicate function for the sub-intention.
     * @param {Object} me - The context or entity for the sub-intention.
     * @param {Object} maps - Additional data or maps required for the sub-intention.
     * @returns {Promise<any>} The result of attempting to achieve the sub-intention.
     */
    async subIntention(predicate, me, maps) {
        console.log('\tsubIntention predicate: ', predicate);
        const sub_intention = new Intention(this, predicate, me, maps); // create a new sub-intention.
        this.#sub_intentions.push(sub_intention); // add the new sub-intention to the array.
        return await sub_intention.achieve(); // attempt to achieve the sub-intention and return the result.
    }
}

export default Plans;