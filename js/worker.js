import Camera from "./camera.js"
import { Granular_mirror, LambertianDiffuse, Material, PerfectDiffuse, Refract, Composite } from "./materials.js";
import { Color } from "./primitives.js";
import Timer from "./Timer.js";
import { Sphere, Triangle } from "./objects.js";
import { computeBVH, gatherFromBVH } from "./BVH.js";

onmessage = e => {
    switch(e.data.msg){
        case "init":
            init(e.data.objs, e.data.camera)
            break
        case "start":
            postMessage(render(e.data))
            break
    }
}

function init(objs, camera){
    self.objs = []
    for(let i=0; i<objs.length; i++){
        const obj = objs[i]
        let new_obj
        switch(obj.name){
            case "Sphere":
                new_obj = Sphere.unSerialize(obj)
                break
            case "Triangle":
                new_obj = Triangle.unSerialize(obj)
                break
            default:
                console.error(`Unknown object : ${obj}`)
        }

        let new_bxdf
        switch(obj.material.BxDF.name){
            case "perfectDiffuse":
                new_bxdf = new PerfectDiffuse()
                break
            case "lambertianDiffuse":
                new_bxdf = new LambertianDiffuse()
                break
            case "granular_mirror":
                new_bxdf = new Granular_mirror()
                break
            case "refract":
                new_bxdf = new Refract()
                break
            case "composite":
                new_bxdf = new Composite()
                break
        }

        new_obj.material = new Material(new_bxdf, obj.material.color, obj.material.multiplier)
        self.objs.push(new_obj)
    }

    self.bvh = computeBVH(self.objs)

    self.camera = camera

    self.sky_color     = Color.new(0.7, 0.7, 1, 1)
    self.current_color = Color.new(1, 1, 1, 1)
    self.timer = new Timer()
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

    postMessage({msg:"progress", progress:0})
    for(let y=startY; y<startY+chunk_height; y++){
        for(let x=startX; x<startX+chunk_width; x++){
            let final_color = Color.new(0,0,0,0)
            
            for(let sample=0; sample < samples_per_pixel; sample++){
                const dx = Math.random()
                const dy = Math.random()
                const ray = Camera.getRay(self.camera, (x+dx)/img_width, (y+dy)/img_height)
                const has_hit = trace(ray)
                Color.gamma_correct(ray.color)
                if(!has_hit){
                    Color.add(final_color, ray.color)
                    break
                }else{
                    Color.div(ray.color, samples_per_pixel)
                    Color.add(final_color, ray.color)
                }
            }

            const index = bytes_per_pixel*( (x-startX) + (y-startY) *chunk_width)
            imageData[index]   = final_color.r*255
            imageData[index+1] = final_color.g*255
            imageData[index+2] = final_color.b*255
            imageData[index+3] = final_color.a*255

            if(index-previous_index == 4000){
                postMessage({msg:"progress", progress:(index-previous_index)/4})
                previous_index = index
            }
        }
    }

    //timer.result()
    
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

function trace(ray, max_iterations=25){
    let has_hit = false
    for(let i=0; i<max_iterations; i++){
        let t = Infinity
        let obj_found

        //self.timer.start()

        let considered_objs = []
        gatherFromBVH(ray, self.bvh, considered_objs)


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

        has_hit = true
        obj_found.applyMaterial(ray, t)

        //self.timer.step("MATERIAL")
    }
    return has_hit
}
