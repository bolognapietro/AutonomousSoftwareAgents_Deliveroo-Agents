class Message {
    constructor() {
        this.header = '';
        this.content = '';
        this.senderInfo = '';
    }

    setHeader(header) {
        this.header = header;
    }

    setContent(content) {
        this.content = content;
    }

    setSenderInfo({name, x, y, points: points, timestamp}) {
        this.senderInfo = {name, x, y, points, timestamp};
    }
}

export default Message;