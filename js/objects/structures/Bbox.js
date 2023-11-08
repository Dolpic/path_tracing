import { Vec3 } from "../../primitives.js"

export class Bbox{

    static fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ){
        self.minX = minX
        self.maxX = maxX
        self.minY = minY
        self.maxY = maxY
        self.minZ = minZ
        self.maxZ = maxZ
        Vec3.set(self.center, (self.maxX+self.minX)/2, (self.maxY+self.minY)/2, (self.maxZ+self.minZ)/2)
        return self
    }

    static new(p1=null, p2=null){
        const self = {
            center: Vec3.new(),
            diagonal: Vec3.new()
        }
        if(p1 == null || p2 == null){
            return Bbox.reset(self)
        }else{
            return Bbox.fromMinMax(self,
                Math.min(p1.x, p2.x),
                Math.max(p1.x, p2.x),
                Math.min(p1.y, p2.y),
                Math.max(p1.y, p2.y),
                Math.min(p1.z, p2.z),
                Math.max(p1.z, p2.z),
            )
        }
    }

    static reset(self){
        self.minX = Infinity
        self.minY = Infinity
        self.minZ = Infinity
        self.maxX = -Infinity
        self.maxY = -Infinity
        self.maxZ = -Infinity
        Vec3.set(self.center, 0,0,0)
        return self
    }

    static getEnglobingCenters(self, objs){
        let minX = Infinity
        let minY = Infinity
        let minZ = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        let maxZ = -Infinity
        for(let i=0; i<objs.length; i++){
            const obj = objs[i]
            if(obj.bbox.center.x < minX) minX = obj.bbox.center.x 
            if(obj.bbox.center.x > maxX) maxX = obj.bbox.center.x 
            if(obj.bbox.center.y < minY) minY = obj.bbox.center.y
            if(obj.bbox.center.y > maxY) maxY = obj.bbox.center.y 
            if(obj.bbox.center.z < minZ) minZ = obj.bbox.center.z 
            if(obj.bbox.center.z > maxZ) maxZ = obj.bbox.center.z 
        }
        return Bbox.fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ)
    }

    static getEnglobing(self, objs){
        let minX = Infinity
        let minY = Infinity
        let minZ = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        let maxZ = -Infinity
        for(let i=0; i<objs.length; i++){
            const obj = objs[i]
            if(obj.bbox.minX < minX) minX = obj.bbox.minX
            if(obj.bbox.maxX > maxX) maxX = obj.bbox.maxX
            if(obj.bbox.minY < minY) minY = obj.bbox.minY
            if(obj.bbox.maxY > maxY) maxY = obj.bbox.maxY
            if(obj.bbox.minZ < minZ) minZ = obj.bbox.minZ
            if(obj.bbox.maxZ > maxZ) maxZ = obj.bbox.maxZ
        }
        return Bbox.fromMinMax(self, minX, maxX, minY, maxY, minZ, maxZ)
    }

    static merge(self, other){
        if(other.minX < self.minX) self.minX = other.minX
        if(other.maxX > self.maxX) self.maxX = other.maxX
        if(other.minY < self.minY) self.minY = other.minY
        if(other.maxY > self.maxY) self.maxY = other.maxY
        if(other.minZ < self.minZ) self.minZ = other.minZ
        if(other.maxZ > self.maxZ) self.maxZ = other.maxZ
        Vec3.set(self.center, (self.maxX+self.minX)/2, (self.maxY+self.minY)/2, (self.maxZ+self.minZ)/2)
        return self
    }

    static surfaceArea(self){
        const diag_x = self.maxX-self.minX
        const diag_y = self.maxY-self.minY
        const diag_z = self.maxZ-self.minZ
        return 2* (diag_x * diag_y + diag_x * diag_z + diag_y * diag_z)
    }

    static hitRay(bbox, ray){
        let min
        let max

        const xInverse = 1 / ray.getDirection().x
        const tNearX = (bbox.minX - ray.origin.x) * xInverse
        const tFarX  = (bbox.maxX - ray.origin.x) * xInverse

        if(tNearX > tFarX){
            min = tFarX
            max = tNearX
        }else{
            min = tNearX
            max = tFarX
        }

        const yInverse = 1 / ray.getDirection().y
        const tNearY = (bbox.minY - ray.origin.y) * yInverse
        const tFarY  = (bbox.maxY - ray.origin.y) * yInverse

        if(tNearY > tFarY){
            min = min < tFarY  ? tFarY  : min
            max = max > tNearY ? tNearY : max
        }else{
            min = min < tNearY ? tNearY : min
            max = max > tFarY  ? tFarY  : max
        }

        if(max < min) return false

        const zInverse = 1 / ray.getDirection().z
        const tNearZ = (bbox.minZ - ray.origin.z) * zInverse
        const tFarZ  = (bbox.maxZ - ray.origin.z) * zInverse

        if(tNearZ > tFarZ){
            min = min < tFarZ  ? tFarZ  : min
            max = max > tNearZ ? tNearZ : max
        }else{
            min = min < tNearZ ? tNearZ : min
            max = max > tFarZ  ? tFarZ  : max
        }

        return min < max
    }
}