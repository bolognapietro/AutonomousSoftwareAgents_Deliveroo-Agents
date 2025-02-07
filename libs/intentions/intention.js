import GoPutDown from '../actions/put_down.js'
import GoPickUp from '../actions/pick_up.js'
import GoTo from '../actions/go_to.js'
import PddlMove from '../actions/pddl_move.js'

const usePDDL = false;

const planLibrary = []

if (usePDDL) {
    planLibrary.push(PddlMove)
}
else {
    planLibrary.push(GoTo)
    planLibrary.push(GoPickUp)
    planLibrary.push(GoPutDown)
}

/**
 * Class representing an Intention.
 */
class Intention {

    /**
     * Stores the current plan being used to achieve the intention.
     * @type {Object}
     * @private
     */
    #current_plan;

    /**
     * Boolean indicating whether the intention has been stopped.
     * @type {boolean}
     * @private
     */
    #stopped = false;

    /**
     * Getter method allows external access to the private #stopped field to check if the intention has been stopped.
     * @returns {boolean} True if the intention has been stopped, otherwise false.
     */
    get stopped () {
        return this.#stopped;
    }

    /**
     * Method sets the #stopped field to true and stops the current plan if it exists.
     */
    stop () {
        this.#stopped = true;
        if ( this.#current_plan)
            this.#current_plan.stop();
    }

    /**
     * Reference to the parent object, typically the one managing or creating the intention.
     * @type {Object}
     * @private
     */
    #parent;

    /**
     * Getter method allows external access to the private #predicate field.
     * @returns {Array} The predicate describing the intention details.
     */
    get predicate () {
        return this.#predicate;
    }

    /**
     * Specific details of the intention, usually in the form of an array like ['go_to', x, y].
     * @type {Array}
     * @private
     */
    #predicate;

    /**
     * @type {Object}
     * @private
     */
    #me;

    /**
     * @type {Object}
     * @private
     */
    #maps;

    /**
     * Getter method for the #me field.
     * @returns {Object} The #me object.
     */
    get_me() {
        return this.#me;
    }

    /**
     * Getter method for the #maps field.
     * @returns {Object} The #maps object.
     */
    get_maps() {
        return this.#maps;
    }

    /**
     * Getter method for the arguments.
     * @returns {Array} An array containing the #me and #maps objects.
     */
    get_args() {
        return [this.#me, this.#maps];
    }

    /**
     * Initializes an instance with a parent and a predicate.
     * The parent is typically the object that manages this intention, and the predicate describes the intention details.
     * @param {Object} parent - The parent object managing this intention.
     * @param {Array} predicate - The predicate describing the intention details.
     * @param {Object} me - The object representing the agent.
     * @param {Object} maps - The object representing the maps.
     */
    constructor ( parent, predicate, me, maps ) {
        this.#parent = parent;
        this.#predicate = predicate;
        this.#me = me;
        this.#maps = maps;
    }

    /**
     * A utility method for logging. It uses the parent's log method if available; otherwise, it defaults to console.log.
     * @param {...*} args - The arguments to log.
     */
    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    /**
     * Boolean to ensure that the intention's achievement process is not started more than once.
     * @type {boolean}
     * @private
     */
    #started = false;

    /**
     * Achieves the intention by iterating through each plan class available in the planLibrary.
     * @returns {Promise<*>} The result of the plan execution.
     * @throws Will throw an error if the intention is stopped or if no plan satisfies the intention.
     */
    async achieve () {
        // Check if the intention has already started; if so, return the current instance to prevent re-execution.
        if (this.#started)
            return this;
        else
            this.#started = true; // mark the intention as started to block subsequent starts.
    
        // Iterate through each plan class available in the planLibrary.
        for (const planClass of planLibrary) {

            // console.log('prova ', ...this.predicate)
            // If the intention has been stopped, throw an exception indicating the intention was stopped.
            if (this.stopped) throw ['stopped intention', ...this.predicate];
    
            // Check if the current plan class is applicable to the current intention's predicate.
            if (planClass.isApplicableTo(...this.predicate)) {
                // console.log('PROVA SU PROVA ', this_me, planClass.name)
                this.#me.notMoving(true)
                this.#me.setCurrentIntention(this.predicate)
                this.#current_plan = new planClass(this.#parent, this.#me, this.#maps); // instantiate the plan class with the parent of the intention.
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name); // log the start of achieving the intention with the specific plan.
                try {
                    const plan_res = await this.#current_plan.execute(...this.predicate); // execute the plan and await its result.
                    this.log('successful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res); // log the successful completion of the intention with the result.
                    if (plan_res === false){
                        break;
                    }
                    this.#me.notMoving(false)
                    //! this.#me.setCurrentIntention(null)
                    return plan_res; // return the result of the plan execution.
                } catch (error) {
                    this.log('failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', error); // log any errors encountered during the execution of the plan.
                }
            }
        }
    
        // If the intention has been stopped during the execution, throw an exception.
        if (this.stopped) throw ['stopped intention', ...this.predicate];
        // If no plan was able to satisfy the intention, throw an exception indicating this.
        throw ['no plan satisfied the intention', ...this.predicate];
    }

}
export default Intention;