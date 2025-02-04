import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

/**
 * Configuration object for the client.
 * 
 * @property {Object} configs - The main configuration object.
 * @property {string} configs.host - The host URL for the client.
 * @property {Object} configs.token - An object containing tokens for different agents.
 * @property {string} configs.token.agent1 - The token for agent1.
 * @property {string} configs.token.agent2 - The token for agent2.
 */
const configs = {
    host: "http://localhost:8080",
    token: {
        'agent1': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4MWIzMTBmMmVjIiwibmFtZSI6ImFnZW50MSIsImlhdCI6MTczMTM5ODE4Mn0.RB_QTliRaYdBEpm-qx0xfMToynY-oYxfR9dlpmH0rH0',
        'agent2': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgxYjMxMGYyZWM1IiwibmFtZSI6ImFnZW50MiIsImlhdCI6MTczMTM5ODQ0MH0.89CKOv-SME9bzJjD5SryxnkNII2g7YMzUDE8xlJQ2-A',
    }
}

const name = process.argv[2]; // agent1, agent2 or enemy
const token = configs.token[name]; // token for the agent

export const client = new DeliverooApi(
    configs.host,
    token 
)