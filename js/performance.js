export default class Timer{
    constructor(){
        this.reset()
    }

    reset(){
        this.measures = {}
    }

    start(){
        this.counter = 0
        this.last = performance.now()
    }

    step(){
        if(this.measures[this.counter] == undefined){
            this.measures[this.counter] = {
                count: 1,
                total_time: performance.now() - this.last
            }
        }else{
            this.measures[this.counter].count++
            this.measures[this.counter].total_time += performance.now() - this.last
        }
        this.counter++
        this.last = performance.now()
    }

    result(){
        let txt = ""
        for(let k in this.measures){
            let id = parseInt(k)
            let count = this.measures[k].count
            let time = (1000*this.measures[k].total_time/count).toFixed(5)
            txt += `${id} -> ${id+1} : ${time} ms   (${count} measures) \n`
        }
        console.log(txt)
    }
}