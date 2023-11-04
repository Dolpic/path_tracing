import Camera from "./Camera.js"
import { Color, Ray, Vec3 } from "./primitives.js";
import Timer from "./Timer.js";
import { deserialize } from "./shapes.js";
import { computeBVH, gatherFromBVH, isOccluded } from "./BVH.js";
import { BxDF, deserialize as deserialize_mat } from "./materials.js";
import { deserialize as deserialize_light, sampleLight } from "./Lights.js";

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
    self.materials = scene.materials.map(mat=>deserialize_mat(mat))
    self.lights    = scene.lights.map(light=> deserialize_light(light))
    self.bvh       = computeBVH(scene.shapes.map(obj=>deserialize(obj)), self.timer)
    self.camera    = camera
    self.sky_color = Color.new(0,0,0,1) //Color.new(0.7, 0.7, 1, 1)
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
    let path_weight = Color.new(1,1,1,1)
    for(let i=0; i<max_iterations && !Color.isNearZero(path_weight); i++){
        let t = Infinity
        let obj_found

        self.timer.start()

        { // Find intersection
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
        }

       self.timer.step("HIT")

        { // If ray escaped
            if(t === Infinity){
                Ray.addToThroughput(ray, path_weight, self.sky_color)
                break
            }

        }

        Ray.moveAt(ray, t)
        { // Sample direct illumination from the intersection
            const light = sampleLight(self.lights)
            const lightRay = light.getRay(ray.origin)
            const material = self.materials[obj_found.material]
            const material_color = Color.clone(material.apply(ray, obj_found))
            if(material.type != BxDF.Dielectric){ // TODO Same for similar materials and rewrite that
                if(!isOccluded(lightRay, self.bvh, 1)){
                    const light_color = light.getRadiance(ray)
                    const hit_cos_angle = Math.abs(Vec3.dot(Vec3.normalize(lightRay.direction), obj_found.normalAt(ray.origin)))
                    const hit_color = Color.mulScalar(Color.mul(Color.clone(material_color), light_color), hit_cos_angle) // Here we need to take into account the solid angle -> Jacobian
                    Ray.addToThroughput(ray, path_weight, hit_color) // We should divide by the material color PDF
                }    
            }
            
            Color.mul(path_weight, material_color)
        }

        //console.log(path_weight)

        self.timer.step("MATERIAL")
    }
}
