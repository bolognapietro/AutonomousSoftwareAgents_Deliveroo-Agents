import { client } from './utils/client_config.js';
import Me from './utils/me.js';
import Maps from './utils/map.js';
import { distance, findNearestDeliveryPoint, isValidPosition, findPointsAtDistance } from './utils/support_fn.js';
import IntentionRevision from './intention/intention_rev.js';
import Message from './messages/message.js';
import { handleMsg } from './messages/collaboration.js';

// Initialize agent information
var me = new Me();
var maps;

// Create an instance of IntentionRevision for the agent
const myAgent = new IntentionRevision(me, maps);
myAgent.loop();

// Maps to store agents and parcels information
const agents_map  = new Map();
const parcels = new Map();

// Event listener for detecting the current agent
client.onYou( ( {id, name, x, y, score} ) => {  
    me.setInfos( {id, name, x, y, score} );
    myAgent.me = me;
} );

// Event listener for map information
let deliveryPoints = [];
client.onMap( (height, width, coords) => {
    deliveryPoints = coords.filter(coord => coord.delivery);
    var maps = new Maps(width, height, coords, deliveryPoints);
    myAgent.maps = maps;
});

// Event listener for detecting parcels
client.onParcelsSensing( async ( perceived_parcels ) => {
    let count = 0;
    for (const p of perceived_parcels) {
        parcels.set( p.id, p); // Store parcel data
        myAgent.me.perceiveParticle(p.id, p); 
        if (p.carriedBy == me.id) {
            count++;
        }
    }

    myAgent.me.numParticelsCarried = count;
    myAgent.me.particelsCarried = count > 0;
} );

// Event listener for detecting and selecting the nearest parcel
client.onParcelsSensing(parcels => {
    let options = [];
    const seenParcels = myAgent.get_parcerls_to_pickup();
    for (const parcel of parcels.values()) {
        if (!parcel.carriedBy && !seenParcels.has(parcel.id)) {
            options.push(['go_pick_up', parcel.x, parcel.y, parcel.id]);
        }
    }
    
    let best_option;
    let nearest = Number.MAX_VALUE;
    
    // Find the closest parcel
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
    
    // Sort options by distance
    let goPickUpOptions = options.filter(option => option[0] === 'go_pick_up');
    goPickUpOptions.sort((a, b) => distance({ x: a[1], y: a[2] }, myAgent.me) - distance({ x: b[1], y: b[2] }, myAgent.me));
    
    // Select the best option
    for (const option of goPickUpOptions) {
        let [go_pick_up, x, y, id] = option;
        let current_d = distance({ x, y }, myAgent.me);
        if (current_d < nearest) {
            best_option = option;
            nearest = current_d;
        }
    }
    
    // Decide whether to deliver or pick up parcels
    if ( myAgent.me.particelsCarried ) {
        let deliveryPoint = findNearestDeliveryPoint(myAgent.me, myAgent.maps.getDeliverPoints(), false);
        if ( nearest >= distance(deliveryPoint, myAgent.me) ) { // If the nearest parcel is further than the nearest delivery point
            options = [['go_put_down', deliveryPoint.x, deliveryPoint.y]]
            myAgent.push(options);
        }
        else {
            myAgent.push(options);
        }
    }
    else if ( best_option ) {
        myAgent.push(options);
    }
    // opposite sorted options
    options = options.slice().reverse();

    console.log('options reverse', options);
    // Send parcel information to teammates
    if (myAgent.me.friendId && options.length > 2) {
        let msg = new Message();
        msg.setHeader("INFO_PARCELS");
        msg.setContent(options);
        msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
        client.say(myAgent.me.friendId, msg);
    }
} );

// Event listener for detecting other agents
client.onAgentsSensing( ( agents ) => {
    const timeSeen = Date.now();
    
    // Remove outdated agent data
    agents_map.forEach((value, key) => {
        value.isNear = false;
        if (timeSeen - value.timeSeen > 20000) {
            agents_map.delete(key);
        }
    });

    // Update agent locations
    for (const agent of agents) {
        agents_map.set(agent.id, { agent, timeSeen, isNear: true });
        myAgent.maps.setAgent(agent.id, agent.x, agent.y, timeSeen);
    }

    // Share agent information with teammates
    if (myAgent.me.friendId && agents.length > 0) {
        let msg = new Message();
        msg.setHeader("INFO_AGENTS");
        msg.setContent(agents);
        msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
        client.say(myAgent.me.friendId, msg);
    }
} );

// Handle incoming messages
client.onMsg(async (id, name, msg, reply) => (
    handleMsg(id, name, msg, reply, maps, client, myAgent, agents_map)
));

// Initial handshake when connecting
client.onConnect( async () => {   
    if (myAgent.me.master) {
        let msg = new Message();
        msg.setHeader("HANDSHAKE");
        msg.setContent("attacchiamo?");
        await client.shout(msg);
    }
} );