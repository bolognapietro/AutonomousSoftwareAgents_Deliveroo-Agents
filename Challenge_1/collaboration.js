import Message from './message.js';
async function handleMsg(id, name, msg, reply, me, map, client, myAgent, perceivedAgents) {
    // finalize the handshake
    if (msg.header == 'HANDSHAKE') {
        if (!me.master && msg.content == 'acquarium?') {
            me.setFriendId(id);
            let msg = new Message();
            msg.setHeader("HANDSHAKE");
            msg.setContent("acquarium!");
            await client.say(id, msg, replyAcknowledgmentCallback);
            msg.setHeader("CURRENT_INTENTION");
            msg.setContent(me.currentIntention)
            await client.say(id, msg)
        }
        if (me.master && msg.content == 'acquarium!') {
            me.setFriendId(id);
            console.log('Handshake completed');
            let msg = new Message();
            msg.setHeader("START_JOB");
            msg.setContent({ x: me.x, y: me.y });
            await client.say(id, msg, replyAcknowledgmentCallback);
            // if we use the split map stragey, apply it

            
            msg.setHeader("CURRENT_INTENTION");
            msg.setContent(me.currentIntention)
            await client.say(id, msg)
        }
    }
}

export { handleMsg };