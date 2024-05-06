import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkxYzZkYjdlZmIzIiwibmFtZSI6Im1hcmluYSIsImlhdCI6MTcxNDgwOTc4N30.hidRA7HV9twyqmREyrKtoLXaFq0f06HgXjex2FDCnZ0'
)    
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzODE1MGExNjE0IiwibmFtZSI6InBpZXRybyIsImlhdCI6MTcxMTU1NjQ0MH0.HGuarXnbopYzShTuIwxnA_W4iSDW3U2sWIc8WtPE1aU')

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}


/**
 *! BELIEFSET REVISION FUNCTION
 */

//* MAP
const map = {}
let deliveryPoints = [];

// Event listener triggered when the client senses parcels in the environment.
client.onMap((width, height, coords) => {
    map.width = width;
    map.height = height;
    map.coords = coords;

    deliveryPoints = coords.filter(coord => coord.delivery);
});


/**
 *! OPTIONS GENERATION AND FILTERING FUNCTION
 */

function getDirection_Random (direction_index) {
    if (direction_index > 3)
        direction_index = direction_index % 4;
    return [ 'up', 'right', 'down', 'left' ][ direction_index ];
}

let parcelCarriedByMe = false;

function findNearestDeliveryPoint(agent) {
    let nearest = deliveryPoints.reduce((prev, curr) => {
        let prevDistance = distance({x: prev.x, y: prev.y}, agent);
        let currDistance = distance({x: curr.x, y: curr.y}, agent);
        return (currDistance < prevDistance) ? curr : prev;
    });
    return nearest;
}

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
            let current_d = distance({x, y}, me);
            if (current_d < nearest) {
                best_option = option;
                nearest = current_d;
            }
        }
    }

    if (best_option) {
        myAgent.push(best_option);
    }
    else if (parcelCarriedByMe) {
        let deliveryPoint = findNearestDeliveryPoint(me);
        myAgent.push(['go_put_down', deliveryPoint.x, deliveryPoint.y]);
    }
    else {
        let randomX = Math.floor(Math.random() * map.width);
        let randomY = Math.floor(Math.random() * map.height);
        myAgent.push(['random_move', randomX, randomY]);
    }
});


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

/**
 *! INTENTION
 */

//* parcels
const parcels = new Map(); // object: store parcels' data, using parcel IDs as keys.

var ALREADY_PRINTED = false;

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
                ALREADY_PRINTED = false;
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
            else{
                var direction_index = [ Math.floor(Math.random()*4) ]
                let direction = [ 'up', 'right', 'down', 'left' ][ (direction_index) % 4 ]
                await new Promise( (success, reject) => socket.emit('move', getDirection_Random(direction_index), async (status) =>  {
                    if (status) {
                
                        direction_index += [0,1,3][ Math.floor(Math.random()*3) ]; // may change direction but not going back
                        console.log( 'moved', direction, 'next move', direction_index )
                        success();
        
                    } else reject();

                } ) ).catch( async () => {
        
                    direction_index += Math.floor(Math.random()*4); // change direction if failed going straigth
        
                    console.log( 'failed move', direction, 'next move', getDirection_Random(direction_index) )
        
                } );
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
        // Utilizza l'algoritmo BFS per trovare il percorso più breve verso la particella
        const shortestPath = await this.findShortestPath(me.x, me.y, targetX, targetY, map);
        if (shortestPath !== null) {
            // Esegui le mosse per raggiungere la particella
            for (const move of shortestPath) {
                await client.move(move);
            }
            return true; // Restituisci true se il percorso è stato completato con successo
        } else {
            console.log("Impossibile trovare un percorso per raggiungere la particella.");
            return false; // Restituisci false se non è possibile trovare un percorso

            // Se non è possibile raggiungere la particella, restituisci false e riprova con un'altra particella

        }
    }

    async findShortestPath(agentX, agentY, targetX, targetY, map) {
        const queue = [{ x: agentX, y: agentY, moves: [] }];

        while (queue.length > 0) {
            const { x, y, moves } = queue.shift();

            if (x === targetX && y === targetY) {
                // Hai trovato la particella. Restituisci la sequenza di mosse.
                return moves;
            }

            // Espandi i vicini validi
            const neighbors = this.getValidNeighbors(x, y, map);
            for (const neighbor of neighbors) {
                const { newX, newY, move } = neighbor;
                const newMoves = [...moves, move];
                queue.push({ x: newX, y: newY, moves: newMoves });
            }
        }

        // Se non è possibile raggiungere la particella, restituisci null
        return null;
    }

    getValidNeighbors(x, y, map, visited) {
        const neighbors = [];
        const moves = [[0, 1, 'up'], [0, -1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];

        for (const [dx, dy, move] of moves) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isValidPosition(newX, newY, map)) {
                neighbors.push({ newX, newY, move });
            }
        }

        return neighbors;
    }

    isValidPosition(myX, myY, map) {
        let found = false;
        if (myX >= 0 && myX < map.width && myY >= 0 && myY < map.height){
            map.coords.forEach((row) => {
                if (row.x === myX && row.y === myY) {
                    found = true;
                }
            });
        } 
        return found;
    }
}

class RandomMove extends Plan {
    static isApplicableTo(random_move) {
        return random_move == 'random_move';
    }

    async execute(random_move) {
        const moves = ['up', 'down', 'left', 'right'];
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        await client.move(randomMove);
        return true;
    }
}


// Plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( Move )
planLibrary.push( GoPutDown )
planLibrary.push( RandomMove )