import Message from './message.js';
async function handleMsg(id, name, msg, reply, client, myAgent) {
    // finalize the handshake
    // let splitMSG = msg.hello.split(" ");
    // if (splitMSG[0] == "[HANDSHAKE]" && !myAgent.me.master){
    //     await client.say(id, {
    //         hello: '[HANDSHAKE] ' + client.name + ' ack',
    //         iam: client.name,
    //         id: client.id
    //     });
    // }

    if (msg.header == 'HANDSHAKE') {
        if (!myAgent.me.master && msg.content == 'attacchiamo?') {
            myAgent.me.setFriendId(id);
            let msg = new Message();
            msg.setHeader("HANDSHAKE");
            msg.setContent("attacchiamo!");
            await client.say(id, msg, reply);
            msg.setHeader("CURRENT_INTENTION");
            msg.setContent(myAgent.me.currentIntention)
            await client.say(id, msg)
        }
        if (myAgent.me.master && msg.content == 'attacchiamo!') {
            myAgent.me.setFriendId(id);
            console.log('Handshake completed');
            let msg = new Message();
            msg.setHeader("START_JOB");
            msg.setContent({ x: myAgent.me.x, y: myAgent.me.y });
            await client.say(id, msg, reply);
            msg.setHeader("CURRENT_INTENTION");
            msg.setContent(myAgent.me.currentIntention)
            await client.say(id, msg)
        }
    }
}

export { handleMsg };