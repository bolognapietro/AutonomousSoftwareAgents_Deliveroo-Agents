import c from 'spacy';
import Intention from './intention.js';
import * as fn  from '../utils/support_fn.js';

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

    list_parcel = [];
    
    //* Getter method to access the private intention queue.
    get intention_queue () {
        return this.#intention_queue; 
    }

    // #parcels_picked_up_friend = new Array();

    // get parcels_picked_up_friend() {
    //     return this.#parcels_picked_up_friend;
    // }

    // set parcels_picked_up_friend(value) {
    //     this.#parcels_picked_up_friend = value;
    // }

    get_parcerls_to_pickup() {
        const parcels = new Map();
        for (let intention of this.intention_queue) {
            if (intention.predicate[0] == 'go_pick_up') {
                let id = intention.predicate[2]
                let p = this.me.getParticleById(id)
                if (p && id) {
                    parcels.set(id, p);
                }
            }
        }
        return parcels
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
            if (Date.now() - this.#lastMoveTime > this.#moveInterval ) {
                // console.log('No intentions, moving randomly');
                predicate = this.moveToRandomPos();
                this.#lastMoveTime = Date.now();
            }
        }
        
        if (predicate !== undefined) {
            // Check if the intention is already in the queue
            if (this.intention_queue.some(intent => intent.predicate.join(' ') === predicate.join(' '))) {
                return;
            }
            if ( predicate !== old_predicate ) {    
                if ( this.intention_queue.length >= 1 && this.intention_queue[0].predicate[0] === 'go_put_down' ) {
                    this.intention_queue[0].stop();
                }
                // Create a new intention and push it to the queue
                const intention = new Intention(this, predicate, this.me, this.maps );
                this.intention_queue.push(intention);
                old_predicate = predicate;    
            }
        }
        console.log('intentionRevision.push', this.intention_queue.length);
        //rearrange the queue based on the distance from the agent
        this.intention_queue.sort((a, b) => {
            let a_distance = fn.distance({x: a.predicate[1], y: a.predicate[2]}, this.me);
            let b_distance = fn.distance({x: b.predicate[1], y: b.predicate[2]}, this.me);
            return a_distance - b_distance;
        });

        
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
            else {
                // if (Date.now() - this.#lastMoveTime > this.#moveInterval && !this.#first) {
                //     // console.log('No intentions, moving randomly');
                //     this.moveToPreviusPos();
                //     this.#lastMoveTime = Date.now();
                //     this.#first = true;
                //     this.#moveInterval = 3000;
                // }
                // else if (Date.now() - this.#lastMoveTime > this.#moveInterval && this.#first) {
                //     // console.log('No intentions, moving randomly');
                //     this.moveToRandomPos();
                //     this.#lastMoveTime = Date.now();
                // }
                if (Date.now() - this.#lastMoveTime > this.#moveInterval) {
                    // console.log('No intentions, moving randomly');
                    const movement = this.moveToRandomPos()
                    this.push(movement);
                    this.#lastMoveTime = Date.now();
                }
            }
            await new Promise(res => setImmediate(res));
        }
    }

    moveToPreviusPos() {
        // if (this.checkForParcels()) {

        // }
        return ['go_to', this.#me.previus_position.x, this.#me.previus_position.y];
    }

    moveToRandomPos() {
        // if (this.checkForParcels()) return;
        const random_pos = [[this.#maps.width/4, this.#maps.width/4], [this.#maps.width/4, 3*this.#maps.width/4], [3*this.#maps.width/4, this.#maps.width/4], [3*this.#maps.width/4, 3*this.#maps.width/4]];
        const randomIndex = Math.floor(Math.random() * random_pos.length);
        const selectedPosition = random_pos[randomIndex];
        if (selectedPosition[0] == this.me.x && selectedPosition[1] == this.me.y) {
            const newIndex = (randomIndex + 1) % random_pos.length;
            const newSelectedPosition = random_pos[newIndex];
            return [['go_to', newSelectedPosition[0], newSelectedPosition[1]]];
        } 
        else {
            return [['go_to', selectedPosition[0], selectedPosition[1]]];
        }
    }

    checkForParcels() {
        const parcels = this.#me.map_particels;
        
        for (let [id, parcel] of parcels.entries()) {
            if (!parcel.carriedBy && this.isNearby(parcel)) {
                list_parcel.push(['go_pick_up', parcel.x, parcel.y, id]);
                // myAgent.push(['go_pick_up', parcel.x, parcel.y, id]);
                return true;
            }
        }
        return false;
    }

    isNearby(parcel) {
        const distance = Math.sqrt((parcel.x - this.#me.x) ** 2 + (parcel.y - this.#me.y) ** 2);
        return distance <= 1; // Adjust the distance threshold as needed
    }
    

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