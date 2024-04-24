import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzODE1MGExNjE0IiwibmFtZSI6InBpZXRybyIsImlhdCI6MTcxMTU1NjQ0MH0.HGuarXnbopYzShTuIwxnA_W4iSDW3U2sWIc8WtPE1aU')
/**
 * @type {Map<string,[{id,x,y,carriedBy,reward}]}
 */
const belifset = new Map();
const start = Date.now();
var ADD; client.onConfig( config => ADD = client.config.AGENTS_OBSERVATION_DISTACE );
var me; client.onYou( m => me = m );

client.onAgentsSensing( ( agents ) => {
    const timestamp = Date.now() - start;
    for ( let a of agents ) {
        // if doesn't exists
        if ( ! belifset.has( a.id ) )
            belifset.set( a.id, [] );
        a.timestamp = timestamp;
        // compute direction
        const logs = belifset.get( a.id );
        if ( logs.length>0 ) {
            var previous = logs[logs.length-1];
            if ( previous.x < a.x ) a.direction = 'right';
            else if ( previous.x > a.x ) a.direction = 'left';
            else if ( previous.y < a.y ) a.direction = 'up';
            else if ( previous.y > a.y ) a.direction = 'down';
            else a.direction = 'none';
        }

        belifset.get( a.id ).push( a );
    }

    // compute if within perceiving area

    let prettyPrint = Array
    .from(belifset.values())
    .map( (logs) => {
        const {timestamp,name,x,y,direction} = logs[logs.length-1]
        const d = dist( me, {x,y} );
        return `${name}(${direction}, ${d})@${timestamp}:${x},${y}`;
    }).join(' ');

    console.log(prettyPrint);
} )

const dist = (a1,a2) => Math.abs(a1.x-a2.x) + Math.abs(a1.y-a2.y);
