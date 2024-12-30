import { client } from './client_config.js';
import Me from './me.js';
import Maps from './map.js'
import { distance, findNearestDeliveryPoint, isValidPosition, findPointsAtDistance } from './support_fn.js';
import IntentionRevision from './intention_rev.js';
import Message from './message.js';
import { handleMsg } from './collaboration.js';

var me = new Me();
var maps;
// var friend_name;

client.onYou( ( {id, name, x, y, score} ) => {  // Event listener triggered when the client receives data about the current agent
    me.setInfos( {id, name, x, y, score} );
    // friend_name = (name === 'agent1') ? 'agent2' : 'agent1';
    myAgent.me = me;

} );


const myAgent = new IntentionRevision(me, maps);
myAgent.loop();

const agents_map  = new Map();
const parcels = new Map();

client.onParcelsSensing( async ( perceived_parcels ) => {
    let count = 0;
    for (const p of perceived_parcels) {
        parcels.set( p.id, p)
        myAgent.me.perceiveParticle(p.id, p); 
        if (p.carriedBy == me.id) {
            count++;
        }
    }

    myAgent.me.numParticelsCarried = count;
    if (myAgent.me.numParticelsCarried > 0) {
        myAgent.me.particelsCarried = true;
    }
} );

client.onParcelsSensing(parcels => {
    const options = [];
    const seenParcels = myAgent.get_parcerls_to_pickup();
    for (const parcel of parcels.values()) {
        console.log('PARTICELLA:', parcel.id)
        if (!parcel.carriedBy && !seenParcels.has(parcel.id)) {
            options.push(['go_pick_up', parcel.x, parcel.y, parcel.id]);
        }
    }
    /*
    let best_option;
    let nearest = Number.MAX_VALUE;
    for (const option of options) {
        if (option[0] === 'go_pick_up') {
            let [go_pick_up, x, y, id] = option;
            let current_d = distance({x, y}, myAgent.me);
            if (current_d < nearest) {
                best_option = option;
                nearest = current_d;
            }
        }
    }
    
    // Filtra le opzioni che contengono 'go_pick_up'
    let goPickUpOptions = options.filter(option => option[0] === 'go_pick_up');

    // Ordina le opzioni filtrate in base alla distanza
    goPickUpOptions.sort((a, b) => {
        let distanceA = distance({ x: a[1], y: a[2] }, myAgent.me);
        let distanceB = distance({ x: b[1], y: b[2] }, myAgent.me);
        return distanceA - distanceB;
    });

    // console.log('Sorted goPickUpOptions:', goPickUpOptions);

    // Esegui il ciclo for sulle opzioni ordinate
    for (const option of goPickUpOptions) {
        let [go_pick_up, x, y, id] = option;
        let current_d = distance({ x, y }, myAgent.me);
        if (current_d < nearest) {
            best_option = option;
            nearest = current_d;
        }
    }

    console.log('Option:', goPickUpOptions);
    
    // creare una lista di new Plan per ogni goPickUpOptions
    // const plans = goPickUpOptions.map( ( [move, x, y, id] ) => {
    //     return new Plan( { move , x, y, id } );
    // } );

    // console.log( 'planss: ', plans );
    
    if ( myAgent.me.particelsCarried ) {
        // console.log('getDeliverPoints:', myAgent.maps.getDeliverPoints());
        let deliveryPoint = findNearestDeliveryPoint(myAgent.me, myAgent.maps.getDeliverPoints(), false);
        myAgent.push(['go_put_down', deliveryPoint.x, deliveryPoint.y]);
    }
    */
    if (myAgent.me.friendId && options.length > 0) {
        let msg = new Message();
        msg.setHeader("INFO_PARCELS");
        msg.setContent(options);
        client.say(myAgent.me.friendId, msg);
    }

    if ( options ) {
        options.sort((a, b) => {
            let distanceA = distance({ x: a[1], y: a[2] }, myAgent.me);
            let distanceB = distance({ x: b[1], y: b[2] }, myAgent.me);
            return distanceA - distanceB;
        });
        // const best_plan = new Plan(best_option[0], best_option[1], best_option[2], best_option[3] );
        myAgent.push(options);
    }
} )

client.onAgentsSensing( ( agents ) => {
    // agents_map.x = agents.map( ( {x} ) => {
    //     return x
    // } );
    // agents_map.y = agents.map( ( {y} ) => {
    //     return y
    // } );
    // agents_map.id = agents.map( ( {id} ) => {
    //     return id
    // } );
    const timeSeen = Date.now();

    agents_map.forEach((value, key) => {
        value.isNear = false;
        if (timeSeen - value.timeSeen > 20000) {
            agents_map.delete(key);
        }
    });

    for (const agent of agents) {
        agents_map.set(agent.id, { agent, timeSeen, isNear: true });
        myAgent.maps.setAgent(agent.id, agent.x, agent.y, timeSeen)
    }

    if (myAgent.me.friendId && agents.length > 0) {
        let msg = new Message();
        msg.setHeader("INFO_AGENTS");
        msg.setContent(agents);
        client.say(myAgent.me.friendId, msg);
    }
} )

let deliveryPoints = [];
client.onMap( (height, width, coords) => {
    deliveryPoints = coords.filter(coord => coord.delivery);
    var maps = new Maps(width, height, coords, deliveryPoints);
    // for (const { x, y, delivery } of map) {
        //     maps.set(y, x, delivery ? 1 : 2); //0 = vuoto, 1 = delivery, 2 = piastrella
        // }
    myAgent.maps = maps;
});

client.onMsg(async (id, name, msg, reply) => (
    // console.log('id: ', id),
    // console.log('msg: ', msg),
    handleMsg(id, name, msg, reply, maps, client, myAgent, agents_map)
));

client.onConnect( async () => {   
    if (myAgent.me.master) {
        let msg = new Message();
        msg.setHeader("HANDSHAKE");
        msg.setContent("attacchiamo?")
        await client.shout(msg);
    }
} );
