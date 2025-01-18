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

    setSenderInfo({x: x, y: y, points: points}) {
        this.senderInfo = {x: x, y: y, points: points};
    }
}

export default Message;