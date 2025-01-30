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

class Intention {

    #current_plan; // stores the current plan being used to achieve the intention.
    #stopped = false; // boolean indicating whether the intention has been stopped.

    //* Getter method allows external access to the private #stopped field to check if the intention has been stopped.
    get stopped () {
        return this.#stopped;
    }
    
    //* Method sets the #stopped field to true and stops the current plan if it exists.
    stop () {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if ( this.#current_plan)
            this.#current_plan.stop();
    }

    #parent; // reference to the parent object, typically the one managing or creating the intention.
    
    //* Getter method allows external access to the private #predicate field.
    get predicate () {
        return this.#predicate;
    }
    #predicate; // specific details of the intention, usually in the form of an array like ['go_to', x, y].

    #me;
    #maps;

    get_me() {
        return this.#me;
    }

    get_maps() {
        return this.#maps;
    }

    get_args() {
        return [this.#me, this.#maps];
    }
    
    //* Initializes an instance with a parent and a predicate. The parent is typically the object that manages this intention, and the predicate describes the intention details.
    constructor ( parent, predicate, me, maps ) {
        this.#parent = parent;
        this.#predicate = predicate;
        this.#me = me;
        this.#maps = maps;
    }

    // A utility method for logging. It uses the parent's log method if available; otherwise, it defaults to console.log
    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    #started = false; // boolean to ensure that the intention's achievement process is not started more than once.

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
                this.#me.setCurrentIntention(this.predicate)
                this.#current_plan = new planClass(this.#parent, this.#me, this.#maps); // instantiate the plan class with the parent of the intention.
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name); // log the start of achieving the intention with the specific plan.
                try {
                    const plan_res =    await this.#current_plan.execute(...this.predicate); // execute the plan and await its result.
                    this.log('successful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res); // log the successful completion of the intention with the result.
                    this.#me.setCurrentIntention(null)
                    return plan_res; // return the result of the plan execution.
                } catch (error) {
                    this.log('failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', error); // log any errors encountered during the execution of the plan.
                }
            }
        }
    
        // If the intention has been stopped during the execution, throw an exception.
        if (this.   stopped) throw ['stopped intention', ...this.predicate];
        // If no plan was able to satisfy the intention, throw an exception indicating this.
        throw ['no plan satisfied the intention', ...this.predicate];
    }

}

export default Intention;