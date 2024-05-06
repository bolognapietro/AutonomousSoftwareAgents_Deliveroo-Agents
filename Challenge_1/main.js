import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

import * as fn from './support_fn.js';

const client = new DeliverooApi(
    'http://localhost:8080', //'http://10.196.182.49:8080',
    /// 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkxYzZkYjdlZmIzIiwibmFtZSI6Im1hcmluYSIsImlhdCI6MTcxNDgwOTc4N30.hidRA7HV9twyqmREyrKtoLXaFq0f06HgXjex2FDCnZ0'
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzODE1MGExNjE0IiwibmFtZSI6InBpZXRybyIsImlhdCI6MTcxMTU1NjQ0MH0.HGuarXnbopYzShTuIwxnA_W4iSDW3U2sWIc8WtPE1aU'
)    


/**
 *! BELIEFSET REVISION FUNCTION
 */

//* MAP
const mmap = {}
let deliveryPoints = [];


// Event listener triggered when the client senses parcels in the environment.
client.onMap((width, height, coords) => {
    mmap.width = width;
    mmap.height = height;
    mmap.coords = coords;

    deliveryPoints = coords.filter(coord => coord.delivery);
});


/**
 *! OPTIONS GENERATION AND FILTERING FUNCTION
 */

let parcelCarriedByMe = false;

const position_agents  = {}

client.onAgentsSensing( ( agents ) => {

    position_agents.x = agents.map( ( {x} ) => {
        return x
    } );
    position_agents.y = agents.map( ( {y} ) => {
        return y
    } );
    // console.log( position_agents)
} )


//* ME
const me = {}; // object: store information about the current agent

// Event listener triggered when the client receives data about the current agent.
client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id;       // sets the user's ID
    me.name = name;   // sets the user's name
    me.x = x;         // sets the user's x-coordinate
    me.y = y;         // sets the user's y-coordinate
    me.score = score; // sets the user's score
} );

const map = new Map()
client.onTile( ( x, y, delivery ) => {
    if ( ! map.has(x) )
        map.set(x, new Map)    
    map.get(x).set(y, {x, y, delivery})
} );

// Event listener triggered when parcels are sensed in the environment.
client.onParcelsSensing(parcels => {
    const options = [];
    
    for (const parcel of parcels.values()) {
        if (!parcel.carriedBy) {
            options.push(['go_pick_up', parcel.x, parcel.y, parcel.id]);
        }
    }

    let best_option;
    let nearest = Number.MAX_VALUE;
    for (const option of options) {
        if (option[0] === 'go_pick_up') {
            let [go_pick_up, x, y, id] = option;
            let current_d =fn.distance({x, y}, me);
            if (current_d < nearest) {
                best_option = option;
                nearest = current_d;
            }
        }
    }

    if (best_option) {
        myAgent.push(best_option);
    }
    // else if (parcelCarriedByMe) {
    //     let deliveryPoint = fn.findNearestDeliveryPoint(me, deliveryPoints);
    //     myAgent.push(['go_put_down', deliveryPoint.x, deliveryPoint.y]);
    // }
    // else {
    //     myAgent.push(['go_to', 9, 9]);
    // }
});


/**
 *! INTENTION
 */

//* parcels
const parcels = new Map(); // object: store parcels' data, using parcel IDs as keys.

/**
 *! INTENTION REVISION LOOP
 */
class IntentionRevision {

    #intention_queue = new Array(); // private field to store the queue of intentions.
    
    //* Getter method to access the private intention queue.
    get intention_queue () {
        return this.#intention_queue; 
    }

    //* Infinite loop to continuously process intentions.
    async loop () {
        while ( true ) { 
            // Check if there are any intentions in the queue.
            if ( this.intention_queue.length > 0 ) { 
                console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) ); // log the current intentions.
                
                var intention = this.intention_queue[0]; // get the first intention from the queue.
                console.log('intention', intention.predicate);
                // this.intention_queue.forEach(async (intent) => {
                //     if (intent.predicate[0] == 'go_put_down'){
                //         intention = intent 
                //     }
                // });

                let id = intention.predicate[2] // extract the ID from the intention's predicate.
                let p = parcels.get(id) // retrieve the parcel associated with the ID.
                
                // Check if the parcel is already being carried by another agent.
                if ( p && p.carriedBy ) { 
                    console.log( 'Skipping intention because no more valid', intention.predicate ) // log that the intention is skipped.
                    continue; // skip to the next iteration of the loop.
                }
    
                await intention.achieve() // attempt to achieve the intention.
                .catch( error => { // handle any errors that occur during the achievement.
                    // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                });
    
                this.intention_queue.shift(); // remove the achieved intention from the queue.
            }
            await new Promise( res => setImmediate( res ) ); // postpone the next iteration to allow other operations to proceed.
        }
    }

    // async push ( predicate ) { }
    
    log ( ...args ) {
        console.log( ...args )
    }

}

/**
 ** This class focuses on managing a queue where intentions can accumulate without immediate 
 ** removal unless they are duplicates.
 */
class IntentionRevisionQueue extends IntentionRevision {

    async push ( predicate ) {
        // Check if the intention is already in the queue and return if it is.
        if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return;
    
        console.log( '\nIntentionRevisionReplace.push', predicate ); // log the action of pushing a new intention.
        const intention = new Intention( this, predicate ); // create a new Intention object.
        this.intention_queue.push( intention ); // add the new intention to the queue.
    }

}

/** 
 ** This approach is useful in scenarios where the most recent intention always takes precedence, 
 ** and immediate action is required, making it more dynamic compared to IntentionRevisionQueue.
 */
class IntentionRevisionReplace extends IntentionRevision {

    async push ( predicate ) {
        const last = this.intention_queue.at( this.intention_queue.length - 1 ); // get the last intention in the queue.
        
        // If the last intention is the same as the new one, return without adding it.
        if ( last && last.predicate.join(' ') == predicate.join(' ') ) {
            return; 
        }
    
        console.log( '\nIntentionRevisionReplace.push', predicate ); // log the action of pushing a new intention.
        const intention = new Intention( this, predicate ); // create a new Intention object.
        this.intention_queue.push( intention ); // add the new intention to the queue.
        
        // Stop the last intention if it exists.
        if ( last ) {
            last.stop();
            console.log( 'IntentionRevisionReplace.stop', last.predicate ); // log the stopping of the last intention.
        }
    }

}

// const myAgent = new IntentionRevisionQueue();
const myAgent = new IntentionRevisionReplace();
myAgent.loop();

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

    //* Initializes an instance with a parent and a predicate. The parent is typically the object that manages this intention, and the predicate describes the intention details.
    constructor ( parent, predicate ) {
        this.#parent = parent;
        this.#predicate = predicate;
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
            // If the intention has been stopped, throw an exception indicating the intention was stopped.
            if (this.stopped) throw ['stopped intention', ...this.predicate];
    
            // Check if the current plan class is applicable to the current intention's predicate.
            if (planClass.isApplicableTo(...this.predicate)) {
                this.#current_plan = new planClass(this.#parent); // instantiate the plan class with the parent of the intention.
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name); // log the start of achieving the intention with the specific plan.
                try {
                    const plan_res = await this.#current_plan.execute(...this.predicate); // execute the plan and await its result.
                    this.log('successful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res); // log the successful completion of the intention with the result.
                    return plan_res; // return the result of the plan execution.
                } catch (error) {
                    this.log('failed intention', ...this.predicate, 'with plan', planClass.name, 'with error:', ...error); // log any errors encountered during the execution of the plan.
                }
            }
        }
    
        // If the intention has been stopped during the execution, throw an exception.
        if (this.stopped) throw ['stopped intention', ...this.predicate];
        // If no plan was able to satisfy the intention, throw an exception indicating this.
        throw ['no plan satisfied the intention', ...this.predicate];
    }

}


/**
 *! PLAN LIBRARY
 */

const planLibrary = [];

class Plan {
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

    // Initialize the plan with a reference to the parent object.
    constructor(parent) {
        this.#parent = parent; 
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

class GoPickUp extends Plan {
    static isApplicableTo ( go_pick_up, x, y, id ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y]); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.pickup() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        parcelCarriedByMe = true;
        return true; 
    }

}

class GoPutDown extends Plan {
    static isApplicableTo ( go_put_down, x, y) {
        return go_put_down == 'go_put_down';
    }

    async execute ( go_put_down, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) 
            throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y]); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.putdown() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        parcelCarriedByMe = false;
        return true; 
    }

}

class Move extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to';
    }

    async execute(go_to, targetX, targetY) {
        const init_x = me.x, init_y = me.y;
        const target_x = parseInt(targetX), target_y = parseInt(targetY);

        function search (cost, x, y, previous_tile, action_from_previous) {

            if( ! map.has(x) || ! map.get(x).has(y) )
                return false;
            
            const tile = map.get(x).get(y)
            if( tile.cost_to_here <= cost)
                return false;
            else {
                tile.cost_to_here = cost;
                tile.previous_tile = previous_tile;
                if( action_from_previous )
                    tile.action_from_previous = action_from_previous;
            }
            
            if ( target_x == x && target_y == y ) {
                console.log('found with cost', cost)
                // function backward ( tile ) {
                //     console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
                //     if ( tile.previous_tile ) backward( tile.previous_tile );
                // }
                // backward( tile )
                return true;
            }
        
            let options = new Array(
                [cost+1, x+1, y, tile, 'right'],
                [cost+1, x-1, y, tile, 'left'],
                [cost+1, x, y+1, tile, 'up'],
                [cost+1, x, y-1, tile, 'down']
            );
            options = options.sort( (a, b) => {
                return fn.distance({x: target_x, y: target_y}, {x: a[1], y: a[2]}) - fn.distance({x: target_x, y: target_y}, {x: b[1], y: b[2]})
            } )
        
            search( ...options[0] )
            search( ...options[1] )
            search( ...options[2] )
            search( ...options[3] )
            
        }

        search(0, init_x, init_y);

        const dest = map.get(target_x).get(target_y);
        var tile = dest;
        while (tile.previous_tile) {
            // console.log(tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y);
            await client.move(tile.action_from_previous)
            tile = tile.previous_tile;
        }

        return true; // or handle the return based on your logic
    }

    
}



// Plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( Move )
planLibrary.push( GoPutDown )
