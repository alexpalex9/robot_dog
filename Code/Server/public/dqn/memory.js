// import { sampleSize } from 'lodash';


class Memory {
    /**
     * @param {number} maxMemory
     */
    constructor(maxMemory) {
        this.maxMemory = maxMemory;
        this.samples = new Array();
    }

    /**
     * @param {Array} sample
     */
    addSample(sample) {
        this.samples.push(sample);
        if (this.samples.length > this.maxMemory) {
            let [state,,, nextState] = this.samples.shift();
            state.dispose();
            nextState.dispose();
        }
    }

    sample(nSamples) {
        return _.sampleSize(this.samples, nSamples);
    }
}