import Message from './message.js';
import {distance} from '../utils/support_fn.js';

/**
 * Moves the agent to a random position on the map.
 * The map is divided into four quadrants, and the agent will move to one of the quadrant centers.
 * If the agent is already at the selected position, it will move to the next position in the list.
 *
 * @param {Object} myAgent - The agent object.
 * @param {Object} myAgent.maps - The map object containing the width of the map.
 * @param {number} myAgent.maps.width - The width of the map.
 * @param {Object} myAgent.me - The agent's current position.
 * @param {number} myAgent.me.x - The agent's current x-coordinate.
 * @param {number} myAgent.me.y - The agent's current y-coordinate.
 * @returns {Array} An array containing the action 'go_to' and the coordinates [x, y] to move the agent to.
 */
function simpleMoveToRandomPos(myAgent) {
    const random_pos = [[myAgent.maps.width/4, myAgent.maps.width/4], [myAgent.maps.width/4, 3*myAgent.maps.width/4], [3*myAgent.maps.width/4, myAgent.maps.width/4], [3*myAgent.maps.width/4, 3*myAgent.maps.width/4]];
    const randomIndex = Math.floor(Math.random() * random_pos.length);
    const selectedPosition = random_pos[randomIndex];
    if (selectedPosition[0] == myAgent.me.x && selectedPosition[1] == myAgent.me.y) {
        const newIndex = (randomIndex + 1) % random_pos.length;
        const newSelectedPosition = random_pos[newIndex];
        return [['go_to', newSelectedPosition[0], newSelectedPosition[1]]];
    } 
    else {
        return [['go_to', selectedPosition[0], selectedPosition[1]]];
    }
}

/**
 * Handles incoming messages and performs actions based on the message header and content.
 *
 * @param {string} id - The ID of the sender.
 * @param {string} name - The name of the sender.
 * @param {Object} msg - The message object containing header and content.
 * @param {Function} reply - The function to reply to the message.
 * @param {Object} maps - The maps object for the agent.
 * @param {Object} client - The client object to communicate with other agents.
 * @param {Object} myAgent - The agent object representing the current agent.
 * @param {Map} agents_map - A map of perceived agents.
 * @returns {Promise<void>} - A promise that resolves when the message handling is complete.
 */
async function handleMsg(id, name, msg, reply, maps, client, myAgent, agents_map) {

    if (msg.header == 'HANDSHAKE') {
        // If the agent is the SLAVE and the message content is 'attacchiamo?' then set the friend_id and send a message to the MASTER
        if (!myAgent.me.master && msg.content == 'attacchiamo?') {
            myAgent.me.setFriendId(id);
            let msg = new Message();
            msg.setHeader("HANDSHAKE");
            msg.setContent("attacchiamo!");
            msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            await client.say(id, msg, reply);
        }
        // If the agent is the MASTER and the message content is 'attacchiamo!' then set the friend_id
        if (myAgent.me.master && msg.content == 'attacchiamo!') {
            myAgent.me.setFriendId(id);
            console.log('\n-------- HANDSHAKE COMPLETED--------');
            console.log(msg.senderInfo.name + ' is now my friend!');
            console.log('-----------------------------------');
        }
    }

    if (msg.header === 'INFO_PARCELS') {
        let new_parcels = msg.content;
        if (msg.senderInfo.name != myAgent.me.name && myAgent.me.getCurrentIntention() === null) {
            const seenParcels = myAgent.get_parcerls_to_pickup();
            let nearest = new_parcels[0];
            for (const parcel of new_parcels) {
                if (!parcel.carriedBy && !seenParcels.has(parcel.id) && parcel.rewards > 4) {
                    let distanceA = distance({ x: nearest[1], y: nearest[2] }, myAgent.me);
                    let distanceB = distance({ x: parcel[1], y: parcel[2] }, myAgent.me);
                    if (distanceB < distanceA) {
                        nearest = parcel;
                    }
                }
            }
            if (nearest && distance({ x: nearest[1], y: nearest[2] }, myAgent.me) < 20) {
                myAgent.push(['go_to', nearest[1], nearest[2], nearest[3]]);
            }
        }
    }

    if (msg.header === 'INFO_AGENTS') {
        let perceived_agents = msg.content;
        for (const agent of perceived_agents) {
            if (agent.id !== myAgent.me.id) {
                agents_map.set(agent.id, agent);
                myAgent.maps.setAgent(agent.id, agent.x, agent.y, Date.now())
            }
        }
    }

    if (msg.header === "STUCKED_TOGETHER") {
        myAgent.me.stuckedFriend = true;
        if (msg.content == "You have to move away") {
            await client.putdown()
            await new Promise(r => setTimeout(r, 1000));
            myAgent.me.particelsCarried = false
            let predicate = simpleMoveToRandomPos(myAgent);
            myAgent.push(predicate);
        }
        else{
            let msg = new Message();
            msg.setHeader("STUCKED_TOGETHER");
            msg.setContent("You have to move away");
            msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            await client.say(myAgent.me.friendId, msg);
        }
    }
}

export { handleMsg };