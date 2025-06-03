export default class PtaSocketManager {
    constructor() {
        // The socket channel to use
        this.identifier = `system.${pta.id}`;

        // resoloution callbacks
        this.callbacks = new Map();
        this.listeners = new Map();
        this.requests = new Map();

        // Create the scoket event handler
        game.socket.on(this.identifier, async (event) => {
            //if we arent the target of the emit, ignroe it
            if (event.reciever && event.reciever !== game.user.id) return;

            // if there is a registered listener for this event, call it
            if (this.listeners.has(event.type)) {
                let _f = this.listeners.get(event.type);
                await _f(event);

                if (!event.options.response || event.type === 'RESOLVE') return;

                this.resolve(event);

            } // If there isnt one, throw a new error
            else throw new Error(`No event listener of type ${event.type}`);
        })

        this.#initEvents();
    }

    // setup default events
    #initEvents() {
        // Resoloution event listener, called when we recieve a confirmation that an event was recieved and fully handled
        // allows us to await for another users response, such as to trade items
        this.registerEvent('RESOLVE', async (event) => {
            try {// Resolve events store their original ID as part of the returned data
                if (this.callbacks.has(event.data.id)) {
                    const cb = this.callbacks.get(event.data.id);
                    let _d = cb(event);
                    this.callbacks.delete(event.data.id);
                    return _d;
                } else return event;
            }
            catch (err) {
                console.warn(err);
            }
        });

        // || User notification
        this.registerEvent('NOTIFY', async (event) => {
            ui.notifications.notify(event.data.msg);
        });

        this.registerEvent('WARN', async (event) => {
            ui.notifications.warn(event.data.msg);
        });

        this.registerEvent('ERROR', async (event) => {
            ui.notifications.error(event.data.msg);
        });

        // || Initiate a trade with target user
        this.registerEvent('TRADE', async (event) => {

        });
    }

    /** Returns an object template for event emit and broadcast */
    get getEmitData() {
        return {
            type: 'INVALID',
            data: {},
            options: {
                sender: game.user.uuid,
                reciever: null,
                response: true,// should a callback be registered for this event
                timeout: 0 // should the event timeout if it is a request
            },
            id: pta.utils.randomID()
        }
    }

    get getBroadcastData() {
        return {
            type: 'INVALID',
            data: {},
            options: {
                sender: game.user.uuid,
                reciever: null,
                response: false,// should a callback be registered for this event
                timeout: 0 // should the event timeout if it is a request
            },
            id: pta.utils.randomID()
        }
    }

    async registerEvent(tag, func) {
        this.listeners.set(tag, func);
    }

    async emit(event, cb = null) {
        event = Object.assign(this.getEmitData, event);

        const serverAck = new Promise(resolve => {
            game.socket.emit(this.identifier, event, response => {
                resolve(event);
            })
        })

        // if we dont need a response, or are resolving a previous event we recieved, dont register 
        // confirmation that this message was sent to the reciever
        if (event.type === 'RESOLVE' || !event.options.response) return serverAck;

        // Otherwise, register this events promise
        // this promsie will be fullfilled once the reciever accepts it
        return new Promise((resolve, reject) => {
            this.callbacks.set(event.id, response => {
                if (typeof cb === 'function') {
                    resolve(cb(response));
                } else resolve(response);
            })
        })
    }

    // broadcasts are used to encompass all users at once. triggering the called event
    // for the user triggering the broadcast as well
    // Used mainly for game sync purposes, such as playing animations or audio
    async broadcast(event, cb) {

    }

    async resolve(event) {
        const rd = {
            type: 'RESOLVE',
            response: false,
            data: { id: event.id },
            options: { reciever: event.sender }
        }

        this.emit(rd);
    }
}