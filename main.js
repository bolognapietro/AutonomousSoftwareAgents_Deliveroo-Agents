import { client } from './libs/utils/client_config.js';
import Me from './libs/utils/me.js';
import Maps from './libs/utils/map.js';
import IntentionRevision from './libs/intentions/intention_rev.js';
import Message from './libs/messages/message.js';
import { handleMsg } from './libs/messages/collaboration.js';

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
    // let count = 0;
    for (const p of perceived_parcels) {
        parcels.set( p.id, p); // Store parcel data
        myAgent.me.perceiveParticle(p.id, p);
    }
} );

// Event listener for detecting and selecting the nearest parcel
client.onParcelsSensing(parcels => {
    let options = [];
    const seenParcels = myAgent.get_parcerls_to_pickup();
    for (const parcel of parcels.values()) {
        if (!parcel.carriedBy && !seenParcels.has(parcel.id) && parcel.reward > 2) {
            options.push(['go_pick_up', parcel.x, parcel.y, parcel.id]);
        }
    }

    myAgent.push(options);
    
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

    // Update nearby agents informations
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