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
    for(let i=0; i<objs.length; i++){
        const obj = objs[i]
        if(obj.bbox[minAxis] <= splitValue){
            leftObjs.push(obj)
        }else{
            rightObjs.push(obj)
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

export function gatherFromBVH(ray, bvh, timer=null){
    let result = []
    //if (timer != null) timer.start()
    const hit = Bbox.hitRay(bvh.bbox, ray, timer)
    //if (timer != null) timer.step()
    if(hit){
        if(bvh.is_leaf){
            for(let i=0; i<bvh.objs.length; i++){
                result.push(bvh.objs[i])
            }
        }else{
            const left = gatherFromBVH(ray, bvh.left)
            for(let i=0; i<left.length; i++){
                result.push(left[i])
            }
            const right = gatherFromBVH(ray, bvh.right)
            for(let i=0; i<right.length; i++){
                result.push(right[i])
            }
        }
    }
    //if (timer != null) timer.step()
    return result
}