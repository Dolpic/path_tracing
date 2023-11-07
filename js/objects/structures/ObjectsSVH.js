import { Sbox } from "./Sbox.js"
import { Vec3 } from "../../primitives.js"

export class ObjectsSVH{
    constructor(objectsList){
        this.objectsList = objectsList
    }

    compute(){
        this.svh = this.computeRecursive(this.objectsList)
    }

    computeRecursive(objs){
        const sbox = Sbox.getEnglobing(Sbox.new(Vec3.new(), 0), objs)
        let leftObjs  = []
        let rightObjs = []
    
        if(objs.length <= 2 || !this.split_SAH(objs, leftObjs, rightObjs)){
            return [sbox, objs]
        }
        return [sbox, this.computeRecursive(leftObjs), this.computeRecursive(rightObjs)] 
    }

    /*split_half(objs, left, right){
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
    }*/

    split_SAH(objs, left, right){
        let sbox = Sbox.new(Vec3.new(), 0)
        const parentSurfaceArea = Sbox.surfaceArea(Sbox.getEnglobing(sbox, objs))
        Sbox.getEnglobingCenters(sbox, objs)
    
        let axis
        let lengthStart
        let lengthEnd
        const lengthX = Math.abs( (sbox.center.x+sbox.radius) - (sbox.center.x-sbox.radius) )
        const lengthY = Math.abs( (sbox.center.y+sbox.radius) - (sbox.center.y-sbox.radius) )
        const lengthZ = Math.abs( (sbox.center.z+sbox.radius) - (sbox.center.z-sbox.radius) )
        const max = Math.max(
            lengthX, 
            lengthY, 
            lengthZ
        )
        if(max == 0){
            return false
        }
    
        if(max == lengthX){
            axis = "x"
            lengthStart = Math.min( (sbox.center.x+sbox.radius), (sbox.center.x-sbox.radius) )
            lengthEnd = Math.max( (sbox.center.x+sbox.radius), (sbox.center.x-sbox.radius) )
        }else if(max ==lengthY){
            axis = "y"
            lengthStart = Math.min( (sbox.center.y+sbox.radius), (sbox.center.y-sbox.radius) )
            lengthEnd  = Math.max( (sbox.center.y+sbox.radius), (sbox.center.y-sbox.radius) )
        }else{
            axis = "z"
            lengthStart = Math.min( (sbox.center.z+sbox.radius), (sbox.center.z-sbox.radius) )
            lengthEnd = Math.max( (sbox.center.z+sbox.radius), (sbox.center.z-sbox.radius) )
        }
    
        let cost_no_split = objs.length
    
        const nb_split = 20
        let min_split_cost = Infinity
        let best_right_candidates = []
        let best_left_candidates = []
    
        let right_candidates = {
            objs : [],
            sbox : Sbox.new(Vec3.new(), 0)
        }
        let left_candidates = {
            objs : [],
            sbox : Sbox.new(Vec3.new(), 0)
        }
    
    
        for(let i=1; i<nb_split; i++){
    
            let current_split_cost = 0.5
            let current_split_value = lengthStart + i*(lengthEnd - lengthStart)/nb_split 
    
            right_candidates.objs = []
            Sbox.reset(right_candidates.sbox)
            left_candidates.objs = []
            Sbox.reset(left_candidates.sbox)
    
            for(let j=0; j<objs.length; j++){
                const obj = objs[j]
                if(obj.sbox.center[axis] <= current_split_value){
                    left_candidates.objs.push(obj)
                    Sbox.merge(left_candidates.sbox, obj.sbox)
                }else{
                    right_candidates.objs.push(obj)
                    Sbox.merge(right_candidates.sbox, obj.sbox)
                }
            }
    
            current_split_cost += left_candidates.objs.length* Sbox.surfaceArea(left_candidates.sbox)/parentSurfaceArea
            current_split_cost += right_candidates.objs.length*Sbox.surfaceArea(right_candidates.sbox)/parentSurfaceArea
    
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

    findIntersection(ray){
        let result = []
        this.findIntersectionRecursive(ray, this.svh, result)
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

    findIntersectionRecursive(ray, svh, acc){
        if(Sbox.hitRay(svh[0], ray)){
            if(svh.length == 2){
                const objs = svh[1]
                for(let i=0; i<objs.length; i++){
                    acc.push(objs[i])
                }
            }else{
                this.findIntersectionRecursive(ray, svh[1], acc)
                this.findIntersectionRecursive(ray, svh[2], acc)
            }
        }
    }

    isOccluded(ray, tMax){
        return this.isOccludedRecursive(ray, this.svh, tMax)
    }

    isOccludedRecursive(ray, svh, tMax){
        if(Sbox.hitRay(svh[0], ray)){
            if(svh.length == 2){
                const objs = svh[1]
                for(let i=0; i<objs.length; i++){
                    if(objs[i].hit(ray) < tMax) return true
                }
            }else{
                return (
                    this.isOccludedRecursive(ray, svh[1], tMax) || 
                    this.isOccludedRecursive(ray, svh[2], tMax)
                )
            }
        }
        return false
    }

}