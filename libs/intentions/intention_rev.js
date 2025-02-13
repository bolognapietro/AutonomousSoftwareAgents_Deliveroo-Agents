// import c from 'spacy';
import Intention from './intention.js';
import * as fn  from '../utils/support_fn.js';

/**
 * Class representing an IntentionRevision.
 */
class IntentionRevision {
    #me;
    #maps;
    #intention_queue = new Array(); // private field to store the queue of intentions.
    #lastMoveTime = Date.now();
    #moveInterval = 6000;

    list_parcel = [];

    /**
     * Creates an instance of IntentionRevision.
     * @param {Object} me - The agent instance.
     * @param {Object} maps - The maps instance.
     */
    constructor(me, maps){
        this.#me = me
        this.#maps = maps
    }

    /**
     * Gets the agent instance.
     * @returns {Object} The agent instance.
     */
    get me() {
        return this.#me;
    }

    /**
     * Sets the agent instance.
     * @param {Object} value - The new agent instance.
     */
    set me(value) {
        this.#me = value;
    }

    /**
     * Gets the maps instance.
     * @returns {Object} The maps instance.
     */
    get maps(){
        return this.#maps;
    }

    /**
     * Sets the maps instance.
     * @param {Object} values - The new maps instance.
     */
    set maps(values){
        this.#maps = values;
    }

    /**
     * Gets the private intention queue.
     * @returns {Array} The intention queue.
     */
    get intention_queue () {
        return this.#intention_queue; 
    }

    /**
     * Gets the parcels to pick up.
     * @returns {Map} The parcels to pick up.
     */
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

    /**
     * Pushes a new intention to the queue.
     * @param {Array} options - The options for the new intention.
     * @returns {Promise<void>}
     */
    async push ( options ) {
        let predicate;
        let old_predicate;
        let nearest_parcel = Number.MAX_VALUE;
        let nearest_delivery_pt = Number.MAX_VALUE;
        
        // Find the nearest parcel
        for (const option of options) {
            let x = option[1];
            let y = option[2];
            let current_d = fn.distance({x, y}, this.#me);
            if (current_d < nearest_parcel) {
                predicate = option;
                nearest_parcel = current_d;
            }
        }

        // Check if the agent is carrying particles and if a delivery point is closer than the nearest parcel
        if ( this.me.particelsCarried ) {
            let deliveryPoint = fn.findNearestDeliveryPoint(this.me, this.maps.deliverPoints);
            nearest_delivery_pt = fn.distance(deliveryPoint, this.me);
            if ( nearest_delivery_pt < nearest_parcel ) {
                predicate = ['go_put_down', deliveryPoint.x, deliveryPoint.y];
            }
        }    

        // If no intentions are available, move randomly
        if ( predicate === undefined ) {
            if (Date.now() - this.#lastMoveTime > this.#moveInterval ) {
                predicate = this.moveToRandomPos();
                this.#lastMoveTime = Date.now();
            }
        }
        
        // If the intention is not already in the queue, push it
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

        // Rearrange the queue based on the distance from the agent
        this.intention_queue.sort((a, b) => {
            let a_distance = fn.distance({x: a.predicate[1], y: a.predicate[2]}, this.me);
            let b_distance = fn.distance({x: b.predicate[1], y: b.predicate[2]}, this.me);
            return a_distance - b_distance;
        });

        console.log('\n');
    }

    /**
     * Infinite loop to continuously process intentions.
     * @returns {Promise<void>}
     */
    async loop () {
        while (true) {
            if (this.intention_queue.length > 0) {
                console.log('intentionRevision.loop', this.intention_queue.map(i => i.predicate));
        
                // Get the last intention in the queue
                const intention = this.intention_queue[ this.intention_queue.length - 1 ];
                console.log('intention:', intention);
                
                // Check if the particle is already carried by another agent
                let id = intention.predicate[2]
                let p = this.me.getParticleById(id)
                if ( p && p.carriedBy ) {
                    console.log( 'Skipping intention because no more valid', intention.predicate )
                    continue;
                }
                
                // Execute the intention
                await intention.achieve()
                    .catch(error => {
                        this.me.counterFailerIncrement();
                        console.log('Failed intention', ...intention.predicate, 'with error:', error)
                    });
                
                // Remove the intention from the queue
                this.intention_queue.shift(); 
                this.#lastMoveTime = Date.now();
            } 
            else {
                // If no intentions are available, move randomly
                if (Date.now() - this.#lastMoveTime > this.#moveInterval) {
                    // If the agent has failed to move twice, move to the previous position instead
                    if (this.me.counterFailer < 2) {
                        const movement = this.moveToRandomPos()
                        this.push(movement);
                    } else{
                        this.push([['go_to', this.me.prevPos.x, this.me.prevPos.y]]);
                    }
                    this.#lastMoveTime = Date.now();
                }
            }
            await new Promise(res => setImmediate(res));
        }
    }

    /**
     * Moves the agent to a random position.
     * @returns {Array} The movement intention.
     */
    moveToRandomPos() {
        const mapData = this.#maps.map;
        
        // Determine map boundaries
        const minX = Math.min(...mapData.map(p => p.x));
        const maxX = Math.max(...mapData.map(p => p.x));
        const minY = Math.min(...mapData.map(p => p.y));
        const maxY = Math.max(...mapData.map(p => p.y));

        // Compute quadrant boundaries
        const midX = Math.floor((minX + maxX) / 2);
        const midY = Math.floor((minY + maxY) / 2);

        // Split map into four blocks
        const quadrants = {
            topLeft: mapData.filter(p => p.x <= midX && p.y >= midY),
            topRight: mapData.filter(p => p.x > midX && p.y >= midY),
            bottomLeft: mapData.filter(p => p.x <= midX && p.y < midY),
            bottomRight: mapData.filter(p => p.x > midX && p.y < midY),
        };

        // Find the central point in each block
        function findCentralPoint(region) {
            if (region.length === 0) return null;
    
            // Find the point closest to the region’s center
            const centerX = Math.round(region.reduce((sum, p) => sum + p.x, 0) / region.length);
            const centerY = Math.round(region.reduce((sum, p) => sum + p.y, 0) / region.length);
    
            return region.reduce((best, p) => {
                const dist = Math.abs(p.x - centerX) + Math.abs(p.y - centerY);
                return best === null || dist < best.dist ? { ...p, dist } : best;
            }, null);
        }
        
        // Generate random positions around the central points
        const available_pos = Object.values(quadrants).map(findCentralPoint).filter(p => p !== null);
        const adjusted_pos = available_pos.map(p => {
            const randomX = p.x + Math.floor(Math.random() * 13) - 6;
            const randomY = p.y + Math.floor(Math.random() * 13) - 6;
            const isValid = mapData.some(point => point.x === randomX && point.y === randomY);
            return isValid ? { x: randomX, y: randomY } : p;
        });
        
        // Select a random position
        const random_pos = [];
        for (const p of adjusted_pos) {
            random_pos.push([p.x, p.y]);
        }

        const randomIndex = Math.floor(Math.random() * random_pos.length);
        const selectedPosition = random_pos[randomIndex];

        // If the agent is already at the selected position, select another one
        if (selectedPosition[0] == this.me.x && selectedPosition[1] == this.me.y) {
            const newIndex = (randomIndex + 1) % random_pos.length;
            const newSelectedPosition = random_pos[newIndex];
            return [['go_to', newSelectedPosition[0], newSelectedPosition[1]]];
        } 
        else {
            return [['go_to', selectedPosition[0], selectedPosition[1]]];
        }
    }

    /**
     * Logs messages to the console.
     * @param {...any} args - The messages to log.
     */
    log ( ...args ) {
        console.log( ...args )
    }
}

export default IntentionRevision;