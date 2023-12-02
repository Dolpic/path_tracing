import { Color } from "./primitives.js";
import { deserialize } from "./objects/Shape.js";
import { ObjectsBVH} from "./objects/structures/ObjectsBVH.js";
import Camera from "./Camera.js"
import { deserialize as deserializeMaterial } from "./materials/utils.js";
import Light from "./Lights.js";
import { PathTracer } from "./Tracer.js";
import Timer from "./Timer.js";

onmessage = e => {
    switch(e.data.msg){
        case "init":
            return init(e.data.id, e.data.scene)
        case "start":
            return postMessage(render(e.data))
    }
}

function postProgress(progression){
    postMessage({msg:"progress", progress:progression})
}

function init(id, scene){
    self.id        = id
    self.camera    = Camera.deserialize(scene.camera)

    const materials = scene.materials.map(m=>deserializeMaterial(m))
    const lights    = scene.lights.map(l=>Light.deserialize(l))
    const objs      = scene.shapes.map(s=>deserialize(s, materials))
    const bvh = new ObjectsBVH(objs)
    bvh.compute()
    self.tracer = new PathTracer(bvh, lights, 5, true, true)
}

function render(params){
    const chunkWidth  = params.chunk_width
    const chunkHeight = params.chunk_height
    const startX      = params.startX
    const startY      = params.startY
    const samplesPerPixel = params.samples_per_pixel
    const bytesPerPixel   = 4
    const imageData = new Uint8ClampedArray(chunkWidth*chunkHeight*bytesPerPixel)

    let previousIndex = 0
    let finalColor = Color.new()

    postProgress(0)
    for(let y=startY; y<startY+chunkHeight; y++){
        for(let x=startX; x<startX+chunkWidth; x++){
            Color.equal(finalColor, Color.ZERO)
            
            for(let sample=0; sample < samplesPerPixel; sample++){
                const dx = Math.random()
                const dy = Math.random()
                const ray = self.camera.getRay((x+dx)/params.img_width, (y+dy)/params.img_height)
                self.tracer.trace(ray)
                Color.div(ray.color, samplesPerPixel)
                Color.add(finalColor, ray.color)
            }

            Color.gamma_correct(finalColor)

            const index = bytesPerPixel*((x-startX)+(y-startY)*chunkWidth)
            imageData[index]   = finalColor.r*255
            imageData[index+1] = finalColor.g*255
            imageData[index+2] = finalColor.b*255
            imageData[index+3] = 255

            if(index-previousIndex >= 10000){
                postProgress((index-previousIndex)/4)
                previousIndex = index
            }
        }
    }

    self.tracer.printTimerResult()
    
    postProgress(chunkWidth*chunkHeight-previousIndex/4)
    return {
        msg:       "finished",
        width:     chunkWidth,
        height:    chunkHeight,
        posX:      startX,
        posY:      startY,
        imageData: imageData
    }
}
