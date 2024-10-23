import {client} from '../client_config.js';
import Plans from '../plan.js';
class GoPickUp extends Plans {
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
        console.log('prova meArray nel costruttore di GoTo: ', this.me); // Aggiungi un log nel costruttore
    }
    
    static isApplicableTo ( move, x, y, id) {
        return 'go_pick_up' == move;
    }

    async execute ( go_pick_up, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        console.log("GoPickUp me: ", this.me);
        await this.subIntention(['go_to', x, y], this.me, this.maps); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.pickup() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        this.me.particelsCarried = true;
        // parcelCarriedByMe = true;
        this.me.previus_position = {x: x, y: y};
        return true; 
    }

}

export default GoPickUp;