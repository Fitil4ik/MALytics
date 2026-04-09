class BiDirectionalPriorityQueue {
    constructor() {
        this.minHeap = [];
        this.maxHeap = [];
        this.insertionOrder = []; 
        this.bundleMap = new Map();
        this.counter = 0;
    }

    enqueue(title, priority) {
        const bundleID = this.counter++;
        const bundle = { priority, title, valid: true };
        this.bundleMap.set(bundleID, bundle);
        this.minHeap.push({ priority, bundleID });
        this.maxHeap.push({ priority, bundleID });

        this.insertionOrder.push(bundleID);
        this.minHeap.sort((a, b) => a.priority - b.priority);
        this.maxHeap.sort((a, b) => b.priority - a.priority);
    }
    
    dequeue(mode) {
        let bundleID;
        if (mode === 'highest') bundleID = this.maxHeap.shift()?.bundleID;
        else if (mode === 'lowest') bundleID = this.minHeap.shift()?.bundleID;
        else if (mode === 'oldest') bundleID = this.insertionOrder.shift();
        else if (mode === 'newest') bundleID = this.insertionOrder.pop();

        if (bundleID !== undefined && this.bundleMap.has(bundleID)) {
            const data = this.bundleMap.get(bundleID);
            if (data.valid) {
                data.valid = false;
                return data.title;
            }
            return this.dequeue(mode); 
        }
        return null;
    }

    peek(mode) {
        let bundleID;
        if (mode === 'highest') bundleID = this.maxHeap[0]?.bundleID;
        else if (mode === 'lowest') bundleID = this.minHeap[0]?.bundleID;
        else if (mode === 'oldest') bundleID = this.insertionOrder[0];
        else if (mode === 'newest') bundleID = this.insertionOrder[this.insertionOrder.length - 1];

        if (bundleID !== undefined && this.bundleMap.has(bundleID)) {
            const data = this.bundleMap.get(bundleID);
            if (data.valid) {
                return data.title;
            } else {
                if (mode === 'highest') this.maxHeap.shift();
                else if (mode === 'lowest') this.minHeap.shift();
                else if (mode === 'oldest') this.insertionOrder.shift();
                else if (mode === 'newest') this.insertionOrder.pop();
                return this.peek(mode);
            }
        }
        return null;
    }
}
module.exports = BiDirectionalPriorityQueue;