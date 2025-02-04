/**
 * Represents a message with a header, content, and sender information.
 */
class Message {
    /**
     * Creates an instance of Message.
     */
    constructor() {
        this.header = '';
        this.content = '';
        this.senderInfo = '';
    }

    /**
     * Sets the header of the message.
     * @param {string} header - The header of the message.
     */
    setHeader(header) {
        this.header = header;
    }

    /**
     * Sets the content of the message.
     * @param {string} content - The content of the message.
     * @param {string} [intention=null] - The intention of the message (optional).
     */
    setContent(content, intention=null) {
        this.content = content;
        if (intention == null) {
            this.content = content;
        }
        else{
            this.content = {content, intention};
        }
    }

    /**
     * Sets the sender information of the message.
     * @param {Object} senderInfo - The sender information.
     * @param {string} senderInfo.name - The name of the sender.
     * @param {number} senderInfo.x - The x-coordinate of the sender's location.
     * @param {number} senderInfo.y - The y-coordinate of the sender's location.
     * @param {number} senderInfo.points - The points of the sender.
     * @param {string} senderInfo.timestamp - The timestamp of the message.
     */
    setSenderInfo({name, x, y, points, timestamp}) {
        this.senderInfo = {name, x, y, points, timestamp};
    }
}

export default Message;