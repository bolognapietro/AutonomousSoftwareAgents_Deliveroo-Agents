import { Intention } from "/home/pietro/Desktop/UniTn/4_anno/Secondo_semestre/Autonomous Software Agents/Lab/Project_AutonomousSoftwareAgents/Challenge_1/modules/intention.js";

/**
 *! INTENTION
 */

//* parcels
export const parcels = new Map(); // object: store parcels' data, using parcel IDs as keys.

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
    
                const intention = this.intention_queue[0]; // get the first intention from the queue.
    
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
export class IntentionRevisionQueue extends IntentionRevision {

    async push ( predicate ) {
        // Check if the intention is already in the queue and return if it is.
        if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return;
    
        console.log( 'IntentionRevisionReplace.push', predicate ); // log the action of pushing a new intention.
        const intention = new Intention( this, predicate ); // create a new Intention object.
        this.intention_queue.push( intention ); // add the new intention to the queue.
    }

}

/** 
 ** This approach is useful in scenarios where the most recent intention always takes precedence, 
 ** and immediate action is required, making it more dynamic compared to IntentionRevisionQueue.
 */
export class IntentionRevisionReplace extends IntentionRevision {

    async push ( predicate ) {
        const last = this.intention_queue.at( this.intention_queue.length - 1 ); // get the last intention in the queue.
        
        // If the last intention is the same as the new one, return without adding it.
        if ( last && last.predicate.join(' ') == predicate.join(' ') ) {
            return; 
        }
    
        console.log( 'IntentionRevisionReplace.push', predicate ); // log the action of pushing a new intention.
        const intention = new Intention( this, predicate ); // create a new Intention object.
        this.intention_queue.push( intention ); // add the new intention to the queue.
        
        // Stop the last intention if it exists.
        if ( last ) {
            last.stop();
        }
    }

}