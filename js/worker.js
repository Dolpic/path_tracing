import Timer from "./Timer.js";
import { Color } from "./primitives.js";
import { deserialize } from "./objects/Shape.js";
import { ObjectsBVH} from "./objects/structures/ObjectsBVH.js";
import Camera from "./Camera.js"
import { deserialize as deserializeMaterial } from "./materials.js"; // TODO do the same as for deserialize in camera
import { Light }    from "./Lights.js";
import { PathTracer } from "./Tracer.js";

onmessage = e => {
    switch(e.data.msg){
        case "init":
            return init(e.data.id, e.data.scene, e.data.camera)
        case "start":
            return postMessage(render(e.data))
    }
}

function init(id, scene, camera){
    self.timer     = new Timer()
    self.id        = id
    self.materials = scene.materials.map(mat=>deserializeMaterial(mat))
    self.camera    = Camera.deserialize(camera)
    self.sky_color = Color.new(0, 0, 0, 1)//Color.new(0.7, 0.7, 1, 1)


    const lights = scene.lights.map(l=>Light.deserialize(l))
    const bvh = new ObjectsBVH(scene.shapes.map(obj=>deserialize(obj)))
    bvh.compute()
    self.tracer = new PathTracer(lights, bvh)
}

function render(params){
    const bytes_per_pixel = 4
    const img_width    = params.img_width
    const img_height   = params.img_height
    const chunk_width  = params.chunk_width
    const chunk_height = params.chunk_height
    const startX       = params.startX
    const startY       = params.startY
    const samples_per_pixel = params.samples_per_pixel
    let imageData = new Uint8ClampedArray(chunk_width*chunk_height*bytes_per_pixel)

    let previous_index = 0
    let final_color = Color.new()

    postMessage({msg:"progress", progress:0})
    for(let y=startY; y<startY+chunk_height; y++){
        for(let x=startX; x<startX+chunk_width; x++){
            Color.equal(final_color, Color.ZERO)
            
            for(let sample=0; sample < samples_per_pixel; sample++){
                const dx = Math.random()
                const dy = Math.random()
                const ray = self.camera.getRay((x+dx)/img_width, (y+dy)/img_height)
                self.tracer.trace(ray)
                Color.div(ray.color, samples_per_pixel)
                Color.add(final_color, ray.color)
            }

            Color.gamma_correct(final_color)

            const index = bytes_per_pixel*( (x-startX) + (y-startY) *chunk_width)
            imageData[index]   = final_color.r*255
            imageData[index+1] = final_color.g*255
            imageData[index+2] = final_color.b*255
            imageData[index+3] = final_color.a*255

            if(index-previous_index >= 10000){
                postMessage({msg:"progress", progress:(index-previous_index)/4})
                previous_index = index
            }
        }
    }

    self.timer.result()
    
    postMessage({msg:"progress", progress:chunk_width*chunk_height-previous_index/4})
    return {
        msg:       "finished",
        width:     chunk_width,
        height:    chunk_height,
        posX:      startX,
        posY:      startY,
        imageData: imageData
    }
}
