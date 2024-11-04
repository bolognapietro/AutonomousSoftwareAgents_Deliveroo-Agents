import Intention from './intention.js';
import * as fn  from './support_fn.js';
class IntentionRevision {
    #me;
    #maps;
    // #parcels = new Map();

    constructor(me, maps){
        this.#me = me
        this.#maps = maps
    }

    get me() {
        return this.#me;
    }

    set me(value) {
        this.#me = value;
    }
    
    get maps(){
        return this.#maps;
    }

    set maps(values){
        this.#maps = values;
    }

    #intention_queue = new Array(); // private field to store the queue of intentions.

    #lastMoveTime = Date.now();
    #moveInterval = 5000;
    #first = false;
    
    //* Getter method to access the private intention queue.
    get intention_queue () {
        return this.#intention_queue; 
    }

    async push ( options ) {
        // Print my position and the options
        // console.log( 'My position: ', me.x, me.y );
        // console.log( 'Options: ', options );

        let predicate;
        let old_predicate;
        let nearest_parcel = Number.MAX_VALUE;
        let nearest_delivery_pt = Number.MAX_VALUE;
        
        for (const option of options) {
            let [go_pick_up, x, y, id] = option;
            let current_d = fn.distance({x, y}, this.#me);
            if (current_d < nearest_parcel) {
                predicate = option;
                nearest_parcel = current_d;
            }
        }
        if ( this.me.particelsCarried ) {
            let deliveryPoint = fn.findNearestDeliveryPoint(this.me, this.maps.deliverPoints);
            nearest_delivery_pt = fn.distance(deliveryPoint, this.me);
            if ( nearest_delivery_pt < nearest_parcel ) {
                predicate = ['go_put_down', deliveryPoint.x, deliveryPoint.y];
            }
        }    
        if ( predicate === undefined ) {
            predicate = ['go_to', 15, 10];
        }
        
        if (predicate !== undefined) {
            // Check if the intention is already in the queue
            if (this.intention_queue.some(intent => intent.predicate.join(' ') === predicate.join(' '))) {
                return;
            }
            if ( predicate !== old_predicate ) {    
                if ( this.intention_queue.length >= 1 && this.intention_queue[0].predicate[0] !== 'go_put_down' ) {
                    this.intention_queue[0].stop();
                }
                // Create a new intention and push it to the queue
                const intention = new Intention(this, predicate, this.me, this.maps );
                this.intention_queue.push(intention);
                old_predicate = predicate;    
            }
        }
        
        // console.log(this.intention_queue.map(i=>i.predicate));
        console.log('\n');
    }

    //* Infinite loop to continuously process intentions.
    async loop () {
        while (true) {
            if (this.intention_queue.length > 0) {
                console.log('intentionRevision.loop', this.intention_queue.map(i => i.predicate));
        
                // var intention = this.intention_queue[0];
                const intention = this.intention_queue[ this.intention_queue.length - 1 ];
                console.log('intention:', intention);
                // var args = intention.get_args();
                       
                let id = intention.predicate[2]
                let p = this.me.getParticleById(id)
                if ( p && p.carriedBy ) {
                    console.log( 'Skipping intention because no more valid', intention.predicate )
                    continue;
                }
                // if (intention.predicate.length == 4) {
                //     let id = intention.predicate[3];
                //     let p = this.#me.getParticleById(id)
                //     // console.log('id:', id, 'p:', p);
                    
                //     if (p && p.carriedBy) {
                //         console.log('Skipping intention because no more valid', intention.predicate);
                //         continue;
                //     }
                // }
        
                await intention.achieve()
                    .catch(error => {
                        console.log('Failed intention', ...intention.predicate, 'with error:', error)
                    });
        
                this.intention_queue.shift(); // Rimuovi l'intenzione usata usando splice()
                this.#lastMoveTime = Date.now();
            } 
            // else {
            //     if (Date.now() - this.#lastMoveTime > this.#moveInterval && !this.#first) {
            //         // console.log('No intentions, moving randomly');
            //         this.moveToPreviusPos();
            //         this.#lastMoveTime = Date.now();
            //         this.#first = true;
            //         this.#moveInterval = 3000;
            //     }
            //     else if (Date.now() - this.#lastMoveTime > this.#moveInterval && this.#first) {
            //         // console.log('No intentions, moving randomly');
            //         this.moveToRandomPos();
            //         this.#lastMoveTime = Date.now();
            //     }
            // }
            await new Promise(res => setImmediate(res));
        }
    }
/*
    moveToPreviusPos() {
        if (this.checkForParcels()) return;
        myAgent.push(['go_to', previus_position.x, previus_position.y]);
    }

    moveToRandomPos() {
        if (this.checkForParcels()) return;
        const random_pos = [[this.#maps.width/4, this.#maps.width/4], [this.#maps.width/4, 3*this.#maps.width/4], [3*this.#maps.width/4, this.#maps.width/4], [3*this.#maps.width/4, 3*this.#maps.width/4]];
        const randomIndex = Math.floor(Math.random() * random_pos.length);
        const selectedPosition = random_pos[randomIndex];
        myAgent.push(['go_to', selectedPosition[0], selectedPosition[1]]);
    }

    checkForParcels() {
        const parcels = this.#me.map_particels;
        for (let [id, parcel] of parcels.entries()) {
            if (!parcel.carriedBy && this.isNearby(parcel)) {
                myAgent.push(['go_pick_up', parcel.x, parcel.y, id]);
                return true;
            }
        }
        return false;
    }

    isNearby(parcel) {
        const distance = Math.sqrt((parcel.x - this.#me.x) ** 2 + (parcel.y - this.#me.y) ** 2);
        return distance <= 1; // Adjust the distance threshold as needed
    }
    */

    // async push ( predicate ) { }
    
    log ( ...args ) {
        console.log( ...args )
    }

}

/** 
 ** This approach is useful in scenarios where the most recent intention always takes precedence, 
 ** and immediate action is required, making it more dynamic compared to IntentionRevisionQueue.
 */
// class IntentionRevisionReplace extends IntentionRevision {

//     async push ( predicate ) {
//         const last = this.intention_queue.at( this.intention_queue.length - 1 ); // get the last intention in the queue.
        
//         // If the last intention is the same as the new one, return without adding it.
//         if ( (last && last.predicate.join(' ') == predicate.join(' ')) ) {
//             return; 
//         }
       
//         console.log( '\nIntentionRevisionReplace.push', predicate ); // log the action of pushing a new intention.
//         // console.log( '\nothers', this.me, this.maps ); // log the action of pushing a new intention.
//         const intention = new Intention( this, predicate, this.me, this.maps ); // create a new Intention object.
//         console.log( 'intention', intention.predicate, intention.get_me() ); // log the new intention.
//         this.intention_queue.push( intention ); // add the new intention to the queue.
        
//         // this.intention_queue.forEach(async (intent) => {
//         //     console.log(`for each -> ${intent.predicate}`);
//         // });
        
//         // Stop the last intention if it exists.
//         if ( last ) { //&& distance({x: me.x, y: me.y}, {x: last.predicate[1], y: last.predicate[2]}) > distance({x: me.x, y: me.y}, {x: predicate[1], y: predicate[2]})
//             last.stop();
//             console.log( 'IntentionRevisionReplace.stop', last.predicate ); // log the stopping of the last intention.
//         }
//     }

// }

export default IntentionRevision;