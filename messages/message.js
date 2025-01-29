class Message {
    constructor() {
        this.header = '';
        this.content = '';
        this.senderInfo = '';
    }

    setHeader(header) {
        this.header = header;
    }

    setContent(content, intention=null) {
        this.content = content;
        if (intention == null) {
            this.content = content;
        }
        else{
            this.content = {content, intention};
        }
    }

    setSenderInfo({name, x, y, points: points, timestamp}) {
        this.senderInfo = {name, x, y, points, timestamp};
    }
}

export default Message;