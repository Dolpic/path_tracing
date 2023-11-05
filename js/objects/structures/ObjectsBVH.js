import { Bbox } from "../../primitives.js"

export class ObjectsBVH{
    constructor(objectsList){
        this.objectsList = objectsList
    }

    compute(){
        this.bvh = this.computeRecursive(this.objectsList)
    }

    computeRecursive(objs){
        const bbox = Bbox.getEnglobing(Bbox.new(), objs)
        let leftObjs  = []
        let rightObjs = []
    
        if(objs.length <= 2 || !this.split_SAH(objs, leftObjs, rightObjs)){
            return [bbox, objs]
        }
        return [bbox, this.computeRecursive(leftObjs), this.computeRecursive(rightObjs)] 
    }

    split_half(objs, left, right){
        let centersBbox = Bbox.new()
        Bbox.getEnglobingCenters(centersBbox, objs)
    
        let axis
        let splitValue
        const lengthX = Math.abs(centersBbox.maxX - centersBbox.minX)
        const lengthY = Math.abs(centersBbox.maxY - centersBbox.minY)
        const lengthZ = Math.abs(centersBbox.maxZ - centersBbox.minZ)
        const max = Math.max(lengthX, lengthY, lengthZ)
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
        return (left.length != 0 && right.length != 0)
    }

    split_SAH(objs, left, right){
        let bbox = Bbox.new()
        const parentSurfaceArea = Bbox.surfaceArea(Bbox.getEnglobing(bbox, objs))
        Bbox.getEnglobingCenters(bbox, objs)
    
        let axis
        let lengthStart
        let lengthEnd
        const lengthX = Math.abs(bbox.maxX - bbox.minX)
        const lengthY = Math.abs(bbox.maxY - bbox.minY)
        const lengthZ = Math.abs(bbox.maxZ - bbox.minZ)
        const max = Math.max(lengthX, lengthY, lengthZ)
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
    
        const nb_split = 20
        let min_split_cost = Infinity
        let best_right_candidates = []
        let best_left_candidates = []
    
        let right_candidates = {
            objs : [],
            bbox : Bbox.new()
        }
        let left_candidates = {
            objs : [],
            bbox : Bbox.new()
        }
    
    
        for(let i=1; i<nb_split; i++){
    
            let current_split_cost = 0.5
            let current_split_value = lengthStart + i*(lengthEnd - lengthStart)/nb_split 
    
            right_candidates.objs = []
            Bbox.reset(right_candidates.bbox)
            left_candidates.objs = []
            Bbox.reset(left_candidates.bbox)
    
            for(let j=0; j<objs.length; j++){
                const obj = objs[j]
                if(obj.bbox[axis] <= current_split_value){
                    left_candidates.objs.push(obj)
                    Bbox.merge(left_candidates.bbox, obj.bbox)
                }else{
                    right_candidates.objs.push(obj)
                    Bbox.merge(right_candidates.bbox, obj.bbox)
                }
            }
    
            current_split_cost += left_candidates.objs.length* Bbox.surfaceArea(left_candidates.bbox)/parentSurfaceArea
            current_split_cost += right_candidates.objs.length*Bbox.surfaceArea(right_candidates.bbox)/parentSurfaceArea
    
            if(current_split_cost < min_split_cost){
                min_split_cost = current_split_cost
                best_right_candidates = [...right_candidates.objs]
                best_left_candidates = [...left_candidates.objs]
            }
        }
    
        if(cost_no_split < min_split_cost || best_left_candidates.length == 0 || best_right_candidates.length == 0){
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

    findIntersection(ray){ // TODO compute the smallest t direction in findIntersectionRecursive
        let result = []
        this.findIntersectionRecursive(ray, this.bvh, result)
        let t=Infinity, objHit=null
        for(let i=0; i<result.length; i++){
            const currentObj = result[i]
            const currentT = currentObj.hit(ray)
            if(currentT < t){
                t = currentT
                objHit = currentObj
            }
        }
        return {t:t, objHit:objHit}
    }

    findIntersectionRecursive(ray, bvh, acc){
        if(Bbox.hitRay(bvh[0], ray)){
            if(bvh.length == 2){
                const objs = bvh[1]
                for(let i=0; i<objs.length; i++){
                    acc.push(objs[i])
                }
            }else{
                this.findIntersectionRecursive(ray, bvh[1], acc)
                this.findIntersectionRecursive(ray, bvh[2], acc)
            }
        }
    }

    isOccluded(ray, tMax){
        return this.isOccludedRecursive(ray, this.bvh, tMax)
    }

    isOccludedRecursive(ray, bvh, tMax){
        if(Bbox.hitRay(bvh[0], ray)){
            if(bvh.length == 2){
                const objs = bvh[1]
                for(let i=0; i<objs.length; i++){
                    if(objs[i].hit(ray) < tMax) return true
                }
            }else{
                return (
                    this.isOccludedRecursive(ray, bvh[1], tMax) || 
                    this.isOccludedRecursive(ray, bvh[2], tMax)
                )
            }
        }
        return false
    }

}