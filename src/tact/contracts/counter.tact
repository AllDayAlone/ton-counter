import "@stdlib/deploy";
 
message AddMessage {
    amount: Int as uint32;
}

contract Counter {
    counter: Int as uint32;
 
    init(initCounter: Int) {
        self.counter = initCounter;
    }
 
    receive(msg: AddMessage) {
        self.counter = self.counter + msg.amount;
    }
 
    get fun counter(): Int {
        return self.counter;
    }
}