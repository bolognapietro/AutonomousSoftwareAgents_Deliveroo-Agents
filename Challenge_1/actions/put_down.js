import {client} from '../client_config.js';
import Plan from '../plan.js';
class GoPutDown extends Plan {
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
        // console.log('prova meArray nel costruttore di GoTo: ', this.me); // Aggiungi un log nel costruttore
    }

    static isApplicableTo ( move, x, y, id  ) {
        return 'go_put_down' == move;
    }

    async execute ( put_down, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) 
            throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y], this.me, this.maps); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.putdown() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        this.me.particelsCarried = false;
        // this.me.numParticelsCarried -= 1;
        // parcelCarriedByMe = false;
        return true; 
    }

}

export default GoPutDown;