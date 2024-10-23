import Intention from "./intention.js";
class Plans {
    #stopped = false; // private field to track whether the plan has been stopped.
    
    stop() {
        // this.log('stop plan'); 
        this.#stopped = true; // set the stopped status to true.
        // Iterate over all sub-intentions.
        for (const i of this.#sub_intentions) { 
            i.stop(); // stop each sub-intention.
        }
    }

    // Getter method for the stopped status.
    get stopped() {
        return this.#stopped; 
    }

    #parent; // private field to hold a reference to the parent object that might be controlling or monitoring this plan.
    #me;
    #maps;
    // Initialize the plan with a reference to the parent object.
    constructor( parent, me, maps ) {
        this.#parent = parent;
        // this.#me = me;
        // this.#maps = maps;
        // console.log(`parent: ${parent} `);
        //- x: ${x} - y: ${y} - id: ${id}`);
    }

    log(...args) {
        // Use the parent's log method if available.
        if (this.#parent && this.#parent.log) {
            this.#parent.log('\t', ...args); 
        } else {
            console.log(...args); // default to console.log if no parent log method is available.
        }
    }

    #sub_intentions = []; // private field to store an array of sub-intentions.

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate); // create a new sub-intention.
        this.#sub_intentions.push(sub_intention); // add the new sub-intention to the array.
        return await sub_intention.achieve(); // attempt to achieve the sub-intention and return the result.
    }
}

export default Plans;