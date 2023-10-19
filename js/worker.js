import Camera from "./camera.js"
import { lambertianDiffuse } from "./materials.js";
import { Bbox, Color } from "./primitives.js";
import Timer from "./Timer.js";
import { Sphere, Triangle } from "./objects.js";

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

function computeBVH(objs){
    let bbox = Bbox.new()
    Bbox.getEnglobing(bbox, objs)

    if(objs.length < 2){
        return {
            is_leaf: true,
            objs: objs,
            bbox: bbox
        }
    }
    
    let centersBbox = Bbox.new()
    Bbox.getEnglobingCenters(centersBbox, objs)

    let minAxis
    let maxAxis 
    let splitValue
    let lengthX = Math.abs(centersBbox.maxX - centersBbox.minX)
    let lengthY = Math.abs(centersBbox.maxY - centersBbox.minY)
    let lengthZ = Math.abs(centersBbox.maxZ - centersBbox.minZ)
    let max = Math.max(lengthX, lengthY, lengthZ)
    if(max == 0){
        return {
            is_leaf: true,
            objs: objs,
            bbox: bbox
        }
    }
    if(max == lengthX){
        minAxis = "minX"
        maxAxis = "maxX"
        splitValue = (centersBbox.maxX + centersBbox.minX)/2
    }else if(max ==lengthY){
        minAxis = "minY"
        maxAxis = "maxY"
        splitValue = (centersBbox.maxY + centersBbox.minY)/2
    }else{
        minAxis = "minZ"
        maxAxis = "maxZ"
        splitValue = (centersBbox.maxZ + centersBbox.minZ)/2
    }

    let leftObjs  = []
    let rightObjs = []
    objs.forEach(obj => {
        if(obj.bbox[minAxis] <= splitValue){
            leftObjs.push(obj)
        }else{
            rightObjs.push(obj)
        }
    })

    if(leftObjs.length == 0 || rightObjs.length == 0){
        return {
            is_leaf: true,
            objs: leftObjs.length == 0 ? rightObjs : leftObjs,
            bbox: bbox
        }
    }

    return {
        is_leaf: false,
        left:    computeBVH(leftObjs),
        right:   computeBVH(rightObjs),
        bbox:    bbox
    }
}

function gatherFromBVH(ray, bvh){
    let result = []

    if(Bbox.hitRay(bvh.bbox, ray)){
        if(bvh.is_leaf){
            result = result.concat(bvh.objs)
        }else{
            result = result.concat(gatherFromBVH(ray, bvh.left))
            result = result.concat(gatherFromBVH(ray, bvh.right)) 
        }
    }

    return result
}

function init(objs, camera){
    self.objs = []
    objs.forEach(obj => {
        switch(obj.name){
            case "Sphere":
                self.objs.push(Sphere.unSerialize(obj))
                break
            case "Triangle":
                self.objs.push(Triangle.unSerialize(obj))
                break
            default:
                console.error(`Unknown object : ${obj}`)
        }
    })

    self.bvh = computeBVH(self.objs)

    self.camera = camera

    self.sky_color     = Color.new(0.8, 0.8, 1, 1)
    self.multiplier    = Color.new(0.6, 0.4, 0.4, 1)
    self.current_color = Color.new(1, 1, 1, 1)
    self.initial_color = Color.new(0.8, 0.8, 1, 1)
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
                const result = trace(ray, self.objs)
                if(!result.has_hit){
                    Color.add(final_color, result.color)
                    break
                }else{
                    Color.div(result.color, samples_per_pixel)
                    Color.add(final_color, result.color)
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

function trace(ray, objs, max_iterations=25, with_bvh=true){
    let has_hit = false
    Color.equal(self.current_color, self.initial_color)

    for(let i=0; i<max_iterations; i++){

        //self.timer.start()

        let t = Infinity
        let obj_found

        if(with_bvh){
            let considered_objs = gatherFromBVH(ray, self.bvh)
            //console.log(considered_objs)
            considered_objs.forEach(obj => {
                const t_tmp = obj.hit(ray)
                if(t_tmp < t){
                    t = t_tmp
                    obj_found = obj
                }
            })
        }else{
            objs.forEach(obj => {
                const t_tmp = obj.hit(ray)
                if(t_tmp < t){
                    t = t_tmp
                    obj_found = obj
                }
            })
        }

      

        //self.timer.step()

        if(t === Infinity){
            Color.mul(self.current_color, self.sky_color)
            break
        }

        has_hit = true
        lambertianDiffuse(ray, t, obj_found)
        Color.mul(self.current_color, self.multiplier)

        //self.timer.step()
    }
    
    return {
        has_hit: has_hit,
        color: Color.gamma_correct(self.current_color)
    }
}