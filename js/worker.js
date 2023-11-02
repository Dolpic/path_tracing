import Camera from "./Camera.js"
import { Color } from "./primitives.js";
import Timer from "./Timer.js";
import { deserialize } from "./shapes.js";
import { computeBVH, gatherFromBVH } from "./BVH.js";
import { deserialize as deserialize_mat } from "./materials.js";

onmessage = e => {
    switch(e.data.msg){
        case "init":
            return init(e.data.id, e.data.scene.shapes, e.data.scene.materials, e.data.camera)
        case "start":
            return postMessage(render(e.data))
    }
}

function init(id, shapes, materials, camera){
    self.timer     = new Timer()
    self.id        = id
    self.materials = materials.map(mat=>deserialize_mat(mat))
    self.bvh       = computeBVH(shapes.map(obj=>deserialize(obj)), self.timer)
    self.camera    = camera
    self.sky_color = Color.new(0.7, 0.7, 1, 1)
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
                const ray = Camera.getRay(self.camera, (x+dx)/img_width, (y+dy)/img_height)
                trace(ray)
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

function trace(ray, max_iterations=100){
    for(let i=0; i<max_iterations; i++){
        let t = Infinity
        let obj_found

        //self.timer.start()

        let considered_objs = []
        gatherFromBVH(ray, self.bvh, considered_objs, self.timer)


        //self.timer.step("BVH")

        for(let i=0; i<considered_objs.length; i++){
            const cur_obj = considered_objs[i]
            const t_tmp = cur_obj.hit(ray)
            if(t_tmp < t){
                t = t_tmp
                obj_found = cur_obj
            }
        }

       //self.timer.step("HIT")

        if(t === Infinity){
            Color.mul(ray.color, self.sky_color)
            break
        }

        self.materials[obj_found.material].apply(ray, t, obj_found)

        //self.timer.step("MATERIAL")
    }
}
