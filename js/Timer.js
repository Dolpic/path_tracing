export default class Timer{
    constructor(){
        this.reset()
    }

    reset(){
        this.measures = {}
    }

    start(){
        this.counter = 1
        this.last = performance.now()
    }

    step(id=this.counter){
        if(this.measures[id] == undefined){
            this.measures[id] = {
                count: 1,
                total_time: performance.now() - this.last
            }
        }else{
            this.measures[id].count++
            this.measures[id].total_time += performance.now() - this.last
        }
        if(id === this.counter){
            this.counter++
        }
        this.last = performance.now()
    }

    compare(func_list){
        const index = Math.floor(Math.random()*func_list.length)
        this.start()
        const res = func_list[index]()
        this.step(index)
        return res
    }

    result(){
        let txt = ""
        let best
        let best_time = Infinity
        let worst
        let worst_time = -Infinity
        for(let k in this.measures){
            let count = this.measures[k].count
            let time = parseFloat((1000*this.measures[k].total_time/count).toFixed(5))
            txt += `${k} : ${time} ms (${count} measures) \n`
            if(time < best_time){
                best = k
                best_time = time
            }
            if(time > worst_time){
                worst = k
                worst_time = time
            }
        }
        txt += `Best : ${best} \n`
        txt += `Worst : ${worst} \n`
        console.log(txt)
    }
}