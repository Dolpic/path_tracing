export default class Slider{
    constructor(parentId, label, value=0, oninput="", min=0, max=1, step=0.0001, fractionDigits=2, updateAfterCreation=false){
        this.parent    = document.getElementById(parentId)
        this.label     = label,
        this.value     = value,
        this.oninput   = oninput
        this.fractionDigits = fractionDigits
        this.updateAfterCreation = updateAfterCreation

        this.containerTag = document.createElement('div')
        this.containerTag.id = this.parentId+"_"+this.label

        this.inputTag = document.createElement('input')
        this.inputTag.id    = this.containerTag.id+"_input"
        this.inputTag.type  = "range"
        this.inputTag.value = this.value
        this.inputTag.min   = min
        this.inputTag.max   = max
        this.inputTag.step  = step
        this.inputTag.addEventListener("input", () => {
            this.updateLabelValue()
            this.oninput(parseFloat(this.inputTag.value))
        })

        this.valueTag = document.createElement('span')
        this.valueTag.id = this.containerTag.id+"_value"
        this.updateLabelValue()

        this.init()
    }

    init(){
        const table   = document.createElement('table')
        const tr      = document.createElement('tr')
        const tdLabel = document.createElement('td')
        const tdInput = document.createElement('td')
        const tdValue = document.createElement('td')
        tdLabel.innerHTML = this.label
        tdInput.appendChild(this.inputTag)
        tdValue.appendChild(this.valueTag)
        tr.appendChild(tdLabel)
        tr.appendChild(tdInput)
        tr.appendChild(tdValue)
        table.appendChild(tr)
        this.containerTag.appendChild(table)
        this.parent.appendChild(this.containerTag)
        if(this.updateAfterCreation){
            this.oninput(this.value)
        }
    }

    updateLabelValue(){
        this.valueTag.innerHTML = parseFloat(this.inputTag.value).toFixed(this.fractionDigits)
    }

    setValue(val){
        this.inputTag.value = val
        this.updateLabelValue()
    }

    getValue(){
        return this.inputTag.value
    }
}

export class SliderGroup{
    constructor(parentId, labels, values, oninput, min, max, step=0.0001, updateAfterCreation=true){
        this.sliders = []
        labels.forEach( (label,i) => {
            document.getElementById(parentId).innerHTML += `<div id="${parentId}_${label}"></div>`
            let callback = () => oninput(labels.map(l => document.getElementById(parentId+"_"+l+"_input").value))
            this.sliders.push(new Slider(parentId, label, values[i], callback, min, max, step, (i==labels.length-1)&&updateAfterCreation)) 
        });
        this.update()
    }

    update(){
        this.sliders.forEach(s => s.update())
    }
}