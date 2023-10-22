import { Bbox } from "./primitives.js"

export function computeBVH(objs){
    let bbox = Bbox.new()
    Bbox.getEnglobing(bbox, objs)

    if(objs.length < 2){
        return {
            is_leaf: true,
            objs: objs,
            bbox: bbox
        }
    }

    let leftObjs  = []
    let rightObjs = []
    if(!split_SAH(objs, leftObjs, rightObjs)){
        return {
            is_leaf: true,
            objs: objs,
            bbox: bbox
        }
    }

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

function split_half(objs, left, right){
    let centersBbox = Bbox.new()
    Bbox.getEnglobingCenters(centersBbox, objs)

    let axis
    let splitValue
    let lengthX = Math.abs(centersBbox.maxX - centersBbox.minX)
    let lengthY = Math.abs(centersBbox.maxY - centersBbox.minY)
    let lengthZ = Math.abs(centersBbox.maxZ - centersBbox.minZ)
    let max = Math.max(lengthX, lengthY, lengthZ)
    if(max == 0){
        return false
    }
    if(max == lengthX){
        axis = "minX"
        splitValue = (centersBbox.maxX + centersBbox.minX)/2
    }else if(max ==lengthY){
        axis = "minY"
        splitValue = (centersBbox.maxY + centersBbox.minY)/2
    }else{
        axis = "minZ"
        splitValue = (centersBbox.maxZ + centersBbox.minZ)/2
    }

    for(let i=0; i<objs.length; i++){
        const obj = objs[i]
        if(obj.bbox[axis] <= splitValue){
            left.push(obj)
        }else{
            right.push(obj)
        }
    }
    return true
}

function split_SAH(objs, left, right){
    //return false
    let bbox = Bbox.new()
    const parentSurfaceArea = Bbox.surfaceArea(Bbox.getEnglobing(bbox, objs))
    Bbox.getEnglobingCenters(bbox, objs)

    let axis
    let lengthStart
    let lengthEnd
    let lengthX = Math.abs(bbox.maxX - bbox.minX)
    let lengthY = Math.abs(bbox.maxY - bbox.minY)
    let lengthZ = Math.abs(bbox.maxZ - bbox.minZ)
    let max = Math.max(lengthX, lengthY, lengthZ)
    if(max == 0){
        return false
    }

    if(max == lengthX){
        axis = "minX"
        lengthStart = bbox.minX
        lengthEnd = bbox.maxX
    }else if(max ==lengthY){
        axis = "minY"
        lengthStart = bbox.minY
        lengthEnd = bbox.maxY
    }else{
        axis = "minZ"
        lengthStart = bbox.minZ
        lengthEnd = bbox.maxZ
    }

    let cost_no_split = objs.length

    const nb_split = 12
    let min_split_cost = Infinity
    let best_right_candidates = []
    let best_left_candidates = []


    for(let i=1; i<nb_split; i++){
        let current_split_cost = 0.5
        let current_split_value = lengthStart + i*(lengthEnd - lengthStart)/nb_split 
        let right_candidates = []
        let left_candidates = []

        for(let j=0; j<objs.length; j++){
            let obj = objs[j]
            if(obj.bbox[axis] <= current_split_value){
                left_candidates.push(obj)
            }else{
                right_candidates.push(obj)
            }
        }

        current_split_cost += Bbox.surfaceArea(Bbox.getEnglobing(bbox, left_candidates))/parentSurfaceArea * left_candidates.length
        current_split_cost += Bbox.surfaceArea(Bbox.getEnglobing(bbox, right_candidates))/parentSurfaceArea * right_candidates.length

        if(current_split_cost < min_split_cost){
            min_split_cost = current_split_cost
            best_right_candidates = [...right_candidates]
            best_left_candidates = [...left_candidates]
        }
    }

    if(cost_no_split < min_split_cost){
        return false
    }

    for(let i=0; i<best_left_candidates.length; i++){
        left.push(best_left_candidates[i])
    }
    for(let i=0; i<best_right_candidates.length; i++){
        right.push(best_right_candidates[i])
    }
    return true
}

export function gatherFromBVH(ray, bvh, acc, timer=null){

   // if (timer != null) timer.start()

    const hit = Bbox.hitRay(bvh.bbox, ray, timer)

    //if (timer != null) timer.step()

    if(hit){
        if(bvh.is_leaf){
            for(let i=0; i<bvh.objs.length; i++){
                acc.push(bvh.objs[i])
            }
        }else{
            gatherFromBVH(ray, bvh.left, acc)
            gatherFromBVH(ray, bvh.right, acc)
        }
    }

    //if (timer != null) timer.step()
}


/*
export function gatherFromBVH3(ray, bvh, acc){
    let queue = [bvh]
    for(let i=0; i<queue.length; i++){
        const current_node = queue[i]
        const hit = Bbox.hitRay(current_node.bbox, ray, timer)
        if(hit){
            if(current_node.is_leaf){
                for(let j=0; j<current_node.objs.length; j++){
                    acc.push(current_node.objs[j])
                }
            }else{
                queue.push(current_node.left)
                queue.push(current_node.right)
            }
        }
    }
}
*/