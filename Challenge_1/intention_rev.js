import Intention from './intention.js';

class IntentionRevision {
    #me;
    // #parcels = new Map();

    get me() {
        return this.#me;
    }

    set me(value) {
        this.#me = value;
    }

    // get parcels() {
    //     return this.#parcels;
    // }

    // set parcels(value) {
    //     this.#parcels = value;
    // }

    #intention_queue = new Array(); // private field to store the queue of intentions.

    #lastMoveTime = Date.now();
    #moveInterval = 5000;
    #first = false;
    
    //* Getter method to access the private intention queue.
    get intention_queue () {
        return this.#intention_queue; 
    }

    //* Infinite loop to continuously process intentions.
    async loop () {
        while (true) {
            if (this.intention_queue.length > 0) {
                console.log('intentionRevision.loop', this.intention_queue.map(i => i.predicate));
        
                var intention = this.intention_queue[0];
                       
                if (intention.predicate.length == 4) {
                    let id = intention.predicate[3];
                    console.log( 'try p: ', this.#me.map_particels.get(id) );

                    let p = this.#me.map_particels.get(id)  // .get(id);

                    console.log('id:', id, 'p:', p);
                    if (p && p.carriedBy) {
                        console.log('Skipping intention because no more valid', intention.predicate);
                        continue;
                    }
                }
        
                await intention.achieve()
                    .catch(error => {
                        console.log('Failed intention', ...intention.predicate, 'with error:', error)
                    });
        
                this.intention_queue.shift(); // Rimuovi l'intenzione usata usando splice()
                this.#lastMoveTime = Date.now();
            } /*
            else {
                if (Date.now() - this.#lastMoveTime > this.#moveInterval && !this.#first) {
                    // console.log('No intentions, moving randomly');
                    this.moveToPreviusPos();
                    this.#lastMoveTime = Date.now();
                    this.#first = true;
                    this.#moveInterval = 3000;
                }
                else if (Date.now() - this.#lastMoveTime > this.#moveInterval && this.#first) {
                    // console.log('No intentions, moving randomly');
                    this.moveToRandomPos();
                    this.#lastMoveTime = Date.now();
                }
            }*/
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
        const random_pos = [[map.width/4, map.width/4], [map.width/4, 3*map.width/4], [3*map.width/4, map.width/4], [3*map.width/4, 3*map.width/4]];
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
        const distance = Math.sqrt((parcel.x - me.x) ** 2 + (parcel.y - me.y) ** 2);
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
class IntentionRevisionReplace extends IntentionRevision {

    async push ( predicate ) {
        const last = this.intention_queue.at( this.intention_queue.length - 1 ); // get the last intention in the queue.
        
        // If the last intention is the same as the new one, return without adding it.
        if ( (last && last.predicate.join(' ') == predicate.join(' ')) ) {
            return; 
        }
       
        console.log( '\nIntentionRevisionReplace.push', predicate ); // log the action of pushing a new intention.
        const intention = new Intention( this, predicate ); // create a new Intention object.

        this.intention_queue.push( intention ); // add the new intention to the queue.
        // console.log('Intention queue:', this.intention_queue);
        this.intention_queue.forEach(async (intent) => {
            console.log('for each -> ', intent.predicate)
        });
        
        // Stop the last intention if it exists.
        if ( last ) { //&& distance({x: me.x, y: me.y}, {x: last.predicate[1], y: last.predicate[2]}) > distance({x: me.x, y: me.y}, {x: predicate[1], y: predicate[2]})
            last.stop();
            console.log( 'IntentionRevisionReplace.stop', last.predicate ); // log the stopping of the last intention.
        }
    }

}

export default IntentionRevisionReplace;